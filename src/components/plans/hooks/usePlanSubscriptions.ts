
import { useState } from "react";
import { useSubscriptionCreation } from "./useSubscriptionCreation";
import { useUpgradePlan } from "./useUpgradePlan";
import { usePlanCancellation } from "./usePlanCancellation";

interface UsePlanSubscriptionsProps {
  userProfile: any;
}

export function usePlanSubscriptions({ userProfile }: UsePlanSubscriptionsProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("pix");
  const { isSubscribing, handleSubscribe, CheckoutDialog } = useSubscriptionCreation();
  const { 
    showUpgradeDialog,
    selectedPlan,
    proratedAmount,
    isUpgrading,
    setShowUpgradeDialog,
    checkUpgradeEligibility,
    handleUpgrade
  } = useUpgradePlan({ userProfile });
  const {
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan
  } = usePlanCancellation();

  const handlePlanChange = async (plan: any) => {
    try {
      if (!plan || !plan.id) {
        throw new Error("Dados do plano inválidos ou ID não encontrado");
      }
      
      console.log("Handling plan change for plan:", plan.id, "with method:", selectedPaymentMethod);
      
      const needsUpgrade = await checkUpgradeEligibility(plan);
      if (!needsUpgrade) {
        await handleSubscribe(plan.id, selectedPaymentMethod);
      }
    } catch (error) {
      console.error("Error in handlePlanChange:", error);
    }
  };

  const handleUpgradePlan = () => {
    if (!selectedPlan) {
      console.error("Nenhum plano selecionado para upgrade");
      return;
    }
    console.log("Upgrading to plan:", selectedPlan.id, "with method:", selectedPaymentMethod);
    handleUpgrade(selectedPaymentMethod);
  };

  return {
    isSubscribing: isSubscribing || isUpgrading,
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
    handleUpgradePlan,
    CheckoutDialog
  };
}
