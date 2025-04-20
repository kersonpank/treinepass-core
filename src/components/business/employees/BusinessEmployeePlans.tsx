import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionCreation } from "@/components/plans/hooks/useSubscriptionCreation";
import { usePlanCancellation } from "@/components/plans/hooks/usePlanCancellation";
import { useEmployeeSubscription } from "./hooks/useEmployeeSubscription";
import { useEmployeeBusinessData } from "./hooks/useEmployeeBusinessData";
import { useCofinancedPlans } from "./hooks/useCofinancedPlans";
import { BusinessAssociationStatus } from "./BusinessAssociationStatus";
import { CurrentSubscription } from "./CurrentSubscription";
import { AvailableCofinancedPlans } from "./AvailableCofinancedPlans";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function BusinessEmployeePlans() {
  const { toast } = useToast();
  const { isSubscribing, handleSubscribe, CheckoutDialog } = useSubscriptionCreation();
  const { handleCancelPlan, isLoading: isCancelling, showCancelDialog, setShowCancelDialog } = usePlanCancellation();
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  
  // Get subscription data using our hooks
  const { userSubscription, isLoadingUserSubscription, refetchUserSubscription } = useEmployeeSubscription();
  const { employeeData, businessSubscription, isLoadingEmployeeData, isLoadingBusinessSub } = useEmployeeBusinessData();
  const { availablePlans, isLoadingPlans } = useCofinancedPlans(businessSubscription);
  
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
      
      // Subscribe to the plan (passando apenas um parâmetro, o ID do plano)
      await handleSubscribe(planId);
      
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
  const isLoading = isLoadingUserSubscription || isLoadingEmployeeData || isLoadingBusinessSub || isLoadingPlans;
  if (isLoading) {
    return <LoadingSpinner text="Carregando dados do plano..." />;
  }

  // Check if user has business association and if business has active subscription
  const noBusinessAssociation = !employeeData || !employeeData.business_profiles || !businessSubscription;
  
  if (noBusinessAssociation) {
    return (
      <BusinessAssociationStatus 
        employeeData={employeeData} 
        businessSubscription={businessSubscription} 
      />
    );
  }

  // Show plans content
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Planos disponíveis através da empresa</h2>
        <p className="text-muted-foreground">
          Planos cofinanciados pela {employeeData.business_profiles.company_name}
        </p>
      </div>
      
      {/* Show current subscription */}
      <CurrentSubscription 
        userSubscription={userSubscription} 
        onCancel={openCancelDialog} 
      />

      {/* Show available plans */}
      <AvailableCofinancedPlans 
        availablePlans={availablePlans || []}
        hasActiveSubscription={userSubscription?.status === 'active'}
        isSubscribing={isSubscribing}
        onSubscribe={handleSubscribeToPlan}
      />
      
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
