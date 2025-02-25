
import { useState } from "react";
import { useSubscriptionCreation } from "./useSubscriptionCreation";
import { useUpgradePlan } from "./useUpgradePlan";
import { usePlanCancellation } from "./usePlanCancellation";

interface UsePlanSubscriptionsProps {
  userProfile: any;
}

export function usePlanSubscriptions({ userProfile }: UsePlanSubscriptionsProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");
  const { isSubscribing, handleSubscribe } = useSubscriptionCreation();
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
    const needsUpgrade = await checkUpgradeEligibility(plan);
    if (!needsUpgrade) {
      handleSubscribe(plan.id, selectedPaymentMethod);
    }
  };

  const handleUpgradePlan = () => {
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
    handleUpgradePlan
  };
}
