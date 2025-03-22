
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseUpgradePlanProps {
  userProfile: any;
}

export function useUpgradePlan({ userProfile }: UseUpgradePlanProps) {
  const { toast } = useToast();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [proratedAmount, setProratedAmount] = useState<number>(0);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const checkUpgradeEligibility = async (plan: any) => {
    if (!userProfile) return;

    const { data: currentSubscription } = await supabase
      .from("user_plan_subscriptions")
      .select("*, benefit_plans(*)")
      .eq("user_id", userProfile.id)
      .eq("status", "active")
      .single();

    if (currentSubscription) {
      const currentPlanCost = currentSubscription.benefit_plans.monthly_cost;
      const newPlanCost = plan.monthly_cost;

      if (newPlanCost < currentPlanCost) {
        toast({
          variant: "destructive",
          title: "Downgrade não permitido",
          description: "Você só pode mudar para planos de valor igual ou superior.",
        });
        return false;
      }

      const { data: proration } = await supabase.rpc('calculate_plan_proration', {
        current_plan_id: currentSubscription.plan_id,
        new_plan_id: plan.id,
        current_subscription_id: currentSubscription.id
      });

      setProratedAmount(proration?.[0]?.prorated_amount || 0);
      setSelectedPlan(plan);
      setShowUpgradeDialog(true);
      return true;
    }

    return false;
  };

  const handleUpgrade = async (paymentMethod: string) => {
    if (!selectedPlan) return;

    try {
      setIsUpgrading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: currentSubscription } = await supabase
        .from("user_plan_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (!currentSubscription) throw new Error("No active subscription found");

      const { data: newSubscription, error } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          start_date: new Date().toISOString(),
          status: "pending",
          upgrade_from_subscription_id: currentSubscription.id,
          proration_credit: proratedAmount
        })
        .select()
        .single();

      if (error) throw error;

      const response = await supabase.functions.invoke('asaas-api', {
        body: {
          userId: user.id,
          planId: selectedPlan.id,
          paymentMethod,
          proratedAmount,
          upgradeFromSubscriptionId: currentSubscription.id
        }
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Upgrade de plano realizado!",
        description: "Você será redirecionado para realizar o pagamento.",
      });

      if (response.data?.subscription?.paymentLink) {
        window.location.href = response.data.subscription.paymentLink;
      }
    } catch (error: any) {
      console.error("Error upgrading plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao realizar upgrade",
        description: error.message,
      });
    } finally {
      setIsUpgrading(false);
      setShowUpgradeDialog(false);
    }
  };

  return {
    showUpgradeDialog,
    selectedPlan,
    proratedAmount,
    isUpgrading,
    setShowUpgradeDialog,
    checkUpgradeEligibility,
    handleUpgrade
  };
}
