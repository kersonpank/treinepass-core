
import { Loader2 } from "lucide-react";
import { PlanCard } from "./components/PlanCard";
import { UpgradeDialog, CancelDialog } from "./components/ConfirmationDialogs";
import { usePlans } from "./hooks/usePlans";
import { useUserProfile, useBusinessAccess } from "./hooks/useUserProfile";
import { usePlanSubscriptions } from "./hooks/usePlanSubscriptions";

export function AvailablePlansList() {
  const { data: userProfile } = useUserProfile();
  const { data: hasBusinessAccess } = useBusinessAccess(userProfile);
  const { data: plans, isLoading } = usePlans(hasBusinessAccess);

  const {
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
  } = usePlanSubscriptions({ userProfile });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSubscribing={isSubscribing}
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={setSelectedPaymentMethod}
            onSubscribe={handlePlanChange}
          />
        ))}
      </div>

      <UpgradeDialog
        show={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        selectedPlan={selectedPlan}
        proratedAmount={proratedAmount}
        isSubscribing={isSubscribing}
        onConfirm={handleUpgradePlan}
      />

      <CancelDialog
        show={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelPlan}
      />
    </>
  );
}
