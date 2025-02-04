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
      // Buscar a academia do admin primeiro
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Admin não encontrado");

      const { data: userAcademia, error: userAcademiaError } = await supabase
        .from("user_academias")
        .select("academia_id")
        .eq("user_id", user.id)
        .single();

      if (userAcademiaError) throw userAcademiaError;

      // Então buscar os planos ativos dessa academia
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("academia_id", userAcademia.academia_id)
        .eq("status", "active")
        .order("price");

      if (error) throw error;
      return data;
    },
  });

  const { data: currentSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["userSubscription", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          plans (
            id,
            name,
            features,
            price
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const handleActivatePlan = async (planId: string) => {
    try {
      setIsSubmitting(true);
      setSelectedPlanId(planId);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 dias de plano

      // Se já existe uma assinatura ativa, desativá-la
      if (currentSubscription) {
        const { error: deactivateError } = await supabase
          .from("subscriptions")
          .update({ status: "inactive" })
          .eq("id", currentSubscription.id);

        if (deactivateError) throw deactivateError;
      }

      // Criar nova assinatura
      const { error } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        payment_status: "paid", // Em produção, isso seria definido após confirmação do pagamento
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

  return (
    <div className="space-y-6">
      {currentSubscription && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {currentSubscription.plans.name}
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
              R$ {plan.price.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </p>
            <ul className="space-y-2 mb-4">
              {plan.features?.map((feature: string, index: number) => (
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
