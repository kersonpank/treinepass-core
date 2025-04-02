
import { useState } from "react";
import { useBusinessPlanSubscription } from "@/components/plans/hooks/useBusinessPlanSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BusinessPlanCard } from "./BusinessPlanCard";
import { CurrentBusinessSubscription } from "./CurrentBusinessSubscription";
import { usePlanCancellation } from "@/components/plans/hooks/usePlanCancellation";
import { CancelSubscriptionDialog } from "../employees/CancelSubscriptionDialog";

export function BusinessPlans() {
  const { toast } = useToast();
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const { isSubscribing, handleSubscribe, CheckoutDialog } = useBusinessPlanSubscription();
  const { handleCancelPlan, isLoading: isCancelling, showCancelDialog, setShowCancelDialog } = usePlanCancellation();

  // Buscar planos empresariais disponíveis (incluindo planos subsidiados)
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["businessPlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .in("plan_type", ["corporate", "corporate_subsidized"])
        .eq("status", "active");

      if (error) {
        console.error("Erro ao buscar planos:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os planos disponíveis.",
        });
        throw error;
      }
      return data;
    },
  });

  // Buscar assinatura atual da empresa
  const { data: businessSubscription, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ["businessActiveSubscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar perfil da empresa
      const { data: businessProfile, error: profileError } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar perfil da empresa:", profileError);
        return null;
      }

      // Buscar assinatura ativa da empresa
      const { data, error } = await supabase
        .from("business_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("business_id", businessProfile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar assinatura:", error);
        throw error;
      }
      
      return data;
    },
  });

  const handleSubscribeToPlan = async (planId: string) => {
    try {
      // Check if business already has an active subscription
      if (businessSubscription?.status === "active") {
        toast({
          variant: "destructive",
          title: "Sua empresa já possui um plano ativo",
          description: "Cancele seu plano atual antes de contratar um novo.",
        });
        return;
      }
      
      // Subscribe to the plan with PIX payment method
      await handleSubscribe(planId, "undefined");
      
      // Refresh subscription data
      setTimeout(() => {
        refetchSubscription();
      }, 2000);
      
    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });
    }
  };

  const openCancelDialog = (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowCancelDialog(true);
  };

  const confirmCancelPlan = async () => {
    if (!selectedSubscription) return;
    
    const success = await handleCancelPlan(selectedSubscription.id);
    if (success) {
      setShowCancelDialog(false);
      refetchSubscription();
    }
  };

  // Show loading state
  if (isLoadingPlans || isLoadingSubscription) {
    return <LoadingSpinner text="Carregando planos disponíveis..." />;
  }

  // Group plans by type
  const corporatePlans = plans?.filter(plan => plan.plan_type === "corporate") || [];
  const subsidizedPlans = plans?.filter(plan => plan.plan_type === "corporate_subsidized") || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Planos para Empresas</h2>
        <p className="text-muted-foreground">
          Escolha um plano para oferecer benefícios aos seus colaboradores.
        </p>
      </div>

      {/* Show current subscription if exists */}
      {businessSubscription && (
        <CurrentBusinessSubscription 
          subscription={businessSubscription}
          onCancel={openCancelDialog}
        />
      )}

      {/* Available corporate plans */}
      {corporatePlans.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">Planos Corporativos</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {corporatePlans.map((plan) => (
              <BusinessPlanCard
                key={plan.id}
                plan={plan}
                onSubscribe={handleSubscribeToPlan}
                isSubscribing={isSubscribing}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available subsidized plans */}
      {subsidizedPlans.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-medium mb-4">Planos Cofinanciados</h3>
          <p className="text-muted-foreground mb-4">
            Planos que podem ser cofinanciados entre empresa e colaborador.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subsidizedPlans.map((plan) => (
              <BusinessPlanCard
                key={plan.id}
                plan={plan}
                onSubscribe={handleSubscribeToPlan}
                isSubscribing={isSubscribing}
              />
            ))}
          </div>
        </div>
      )}

      {plans?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
        </div>
      )}

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog 
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={confirmCancelPlan}
        isLoading={isCancelling}
      />
      
      {/* Checkout Dialog for payment */}
      <CheckoutDialog />
    </div>
  );
}
