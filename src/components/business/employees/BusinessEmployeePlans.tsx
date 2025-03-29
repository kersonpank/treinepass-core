
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoFinancedPlanCard } from "./CoFinancedPlanCard";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionCreation } from "@/components/plans/hooks/useSubscriptionCreation";
import { Loader2 } from "lucide-react";
import { ActiveSubscriptionCard } from "@/components/plans/components/ActivePlanCard";
import { usePlanCancellation } from "@/components/plans/hooks/usePlanCancellation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function BusinessEmployeePlans() {
  const { toast } = useToast();
  const { isSubscribing, handleSubscribe, CheckoutDialog } = useSubscriptionCreation();
  const { handleCancelPlan, isLoading: isCancelling, showCancelDialog, setShowCancelDialog } = usePlanCancellation();
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  // Get current user subscription
  const { data: userSubscription, isLoading: isLoadingUserSubscription, refetch: refetchUserSubscription } = useQuery({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching subscription:", error);
        throw error;
      }
      
      return data;
    },
  });

  // Get employee business association
  const { data: employeeData } = useQuery({
    queryKey: ["employeeData"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('cpf')
        .eq('id', user.id)
        .single();
        
      if (!userProfile?.cpf) return null;
        
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          business_profiles (*)
        `)
        .eq("cpf", userProfile.cpf)
        .eq("status", "active")
        .single();
        
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  // Fetch business subscription and available plans
  const { data: businessSubscription, isLoading: isLoadingBusinessSub } = useQuery({
    queryKey: ["businessSubscription", employeeData?.business_id],
    queryFn: async () => {
      if (!employeeData?.business_id) return null;
      
      const { data, error } = await supabase
        .from("business_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("business_id", employeeData.business_id)
        .eq("status", "active")
        .single();
        
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!employeeData?.business_id,
  });

  // Fetch cofinanced plans based on the business plan
  const { data: availablePlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["cofinancedPlans", businessSubscription?.plan_id],
    queryFn: async () => {
      if (!businessSubscription?.plan_id) return [];
      
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("plan_type", "corporate_subsidized")
        .eq("status", "active");
        
      if (error) throw error;
      return data;
    },
    enabled: !!businessSubscription?.plan_id,
  });
  
  const handleSubscribeToPlan = async (planId: string) => {
    try {
      // Check if user already has an active subscription
      if (userSubscription?.status === "active") {
        toast({
          variant: "destructive",
          title: "Você já possui um plano ativo",
          description: "Cancele seu plano atual antes de contratar um novo.",
        });
        return;
      }
      
      // Subscribe to the plan
      await handleSubscribe(planId, "pix");
      
      // Refresh user subscription data
      setTimeout(() => {
        refetchUserSubscription();
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
      refetchUserSubscription();
    }
  };

  // Show loading state
  if (isLoadingUserSubscription || isLoadingBusinessSub || isLoadingPlans) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user is associated with a business
  if (!employeeData || !employeeData.business_profiles) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">Você não está associado a nenhuma empresa</h3>
        <p className="text-muted-foreground">
          Para acessar planos cofinanciados, é necessário estar vinculado a uma empresa.
        </p>
      </div>
    );
  }

  // Check if business has an active subscription
  if (!businessSubscription) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">Sua empresa não possui um plano ativo</h3>
        <p className="text-muted-foreground">
          A empresa {employeeData.business_profiles.company_name} precisa contratar um plano para oferecer benefícios cofinanciados.
        </p>
      </div>
    );
  }

  // Show active subscription or available plans
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Planos disponíveis através da empresa</h2>
        <p className="text-muted-foreground">
          Planos cofinanciados pela {employeeData.business_profiles.company_name}
        </p>
      </div>
      
      {/* Show current subscription */}
      {userSubscription && userSubscription.status !== 'cancelled' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Seu plano atual</h3>
          <ActiveSubscriptionCard 
            subscription={userSubscription} 
            onCancel={() => openCancelDialog(userSubscription)}
          />
        </div>
      )}

      {/* Show co-financed plans if no active subscription */}
      {(!userSubscription || userSubscription.status === 'cancelled') && (
        <>
          <h3 className="text-lg font-medium mb-4">Planos cofinanciados disponíveis</h3>
          {availablePlans && availablePlans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <CoFinancedPlanCard
                  key={plan.id}
                  plan={plan}
                  isSubscribing={isSubscribing}
                  onSubscribe={handleSubscribeToPlan}
                />
              ))}
            </div>
          ) : (
            <p>Nenhum plano cofinanciado disponível no momento.</p>
          )}
        </>
      )}
      
      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar plano</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar seu plano atual? Você perderá todos os benefícios imediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelPlan}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Checkout Dialog for payment */}
      <CheckoutDialog />
    </div>
  );
}
