
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UsePlanSubscriptionsProps {
  userProfile: any;
}

export function usePlanSubscriptions({ userProfile }: UsePlanSubscriptionsProps) {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [proratedAmount, setProratedAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");

  const handleSubscribe = async (planId: string) => {
    try {
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: newSubscription, error } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      const response = await supabase.functions.invoke('asaas-api', {
        body: {
          userId: user.id,
          planId: planId,
          paymentMethod: selectedPaymentMethod
        }
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Plano contratado!",
        description: "Você será redirecionado para realizar o pagamento.",
      });

      if (response.data?.subscription?.paymentLink) {
        window.location.href = response.data.subscription.paymentLink;
      }
    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handlePlanChange = async (plan: any) => {
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
        return;
      }

      const { data: proration } = await supabase.rpc('calculate_plan_proration', {
        current_plan_id: currentSubscription.plan_id,
        new_plan_id: plan.id,
        current_subscription_id: currentSubscription.id
      });

      setProratedAmount(proration?.[0]?.prorated_amount || 0);
      setSelectedPlan(plan);
      setShowUpgradeDialog(true);
      return;
    }

    handleSubscribe(plan.id);
  };

  const handleCancelPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_plan_subscriptions")
        .update({
          status: "cancelled",
        })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      toast({
        title: "Plano cancelado com sucesso",
        description: "O cancelamento será efetivado no próximo ciclo de cobrança.",
      });
      
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error canceling plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar plano",
        description: error.message,
      });
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedPlan) return;

    try {
      setIsSubscribing(true);
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
          paymentMethod: selectedPaymentMethod,
          proratedAmount: proratedAmount,
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
      setIsSubscribing(false);
      setShowUpgradeDialog(false);
    }
  };

  return {
    isSubscribing,
    showUpgradeDialog,
    showCancelDialog,
    selectedPlan,
    proratedAmount,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    setShowUpgradeDialog,
    setShowCancelDialog,
    handlePlanChange,
    handleCancelPlan,
    handleUpgradePlan
  };
}
