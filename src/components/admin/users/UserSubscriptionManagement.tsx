
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface UserSubscriptionManagementProps {
  userId: string;
  onClose?: () => void;
}

export function UserSubscriptionManagement({
  userId,
  onClose,
}: UserSubscriptionManagementProps) {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["availablePlans"],
    queryFn: async () => {
      // Fetch admin user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Admin não encontrado");

      // Get admin's academy
      try {
        // First check if the table exists
        const { data: academyData, error: academyError } = await supabase
          .from("benefit_plans") // Changed to benefit_plans which exists in the schema
          .select("*")
          .eq("status", "active")
          .order("monthly_cost");

        if (academyError) throw academyError;
        return academyData;
      } catch (error) {
        console.error("Error fetching plans:", error);
        return [];
      }
    },
  });

  const { data: currentSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["userSubscription", userId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("user_plan_subscriptions")
          .select(`
            *,
            plan:plan_id (
              id,
              name,
              monthly_cost
            )
          `)
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;
        return data;
      } catch (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
    },
  });

  const handleActivatePlan = async (planId: string) => {
    try {
      setIsSubmitting(true);
      setSelectedPlanId(planId);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days plan

      // If there's an active subscription, deactivate it
      if (currentSubscription) {
        const { error: deactivateError } = await supabase
          .from("user_plan_subscriptions")
          .update({ status: "cancelled" })
          .eq("id", currentSubscription.id);

        if (deactivateError) throw deactivateError;
      }

      // Create new subscription
      const { error } = await supabase.from("user_plan_subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        payment_status: "paid", // In production, this would be set after payment confirmation
      });

      if (error) throw error;

      toast({
        title: "Plano ativado com sucesso!",
        description: "O usuário já pode começar a treinar.",
      });

      onClose?.();
    } catch (error: any) {
      console.error("Error activating plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao ativar plano",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
      setSelectedPlanId(null);
    }
  };

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Function to safely get plan features with a default value
  const getPlanFeatures = (plan: any): string[] => {
    if (!plan) return [];
    if (Array.isArray(plan.features)) return plan.features;
    return [];
  };

  return (
    <div className="space-y-6">
      {currentSubscription && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {currentSubscription.plan?.name || "Plano Atual"}
              </h3>
              <Badge>Ativo</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Válido até:{" "}
              {new Date(currentSubscription.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
            <p className="text-2xl font-bold mb-4">
              R$ {plan.monthly_cost?.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </p>
            <ul className="space-y-2 mb-4">
              {getPlanFeatures(plan).map((feature: string, index: number) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleActivatePlan(plan.id)}
              disabled={isSubmitting && selectedPlanId === plan.id}
            >
              {isSubmitting && selectedPlanId === plan.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </>
              ) : currentSubscription?.plan_id === plan.id ? (
                "Plano Atual"
              ) : (
                "Ativar Plano"
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
