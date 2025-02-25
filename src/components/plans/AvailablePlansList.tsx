
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanCard } from "./components/PlanCard";
import { ActivePlanCard } from "./components/ActivePlanCard";
import { UpgradeDialog, CancelDialog } from "./components/ConfirmationDialogs";
import { usePlans } from "./hooks/usePlans";
import { useUserProfile, useBusinessAccess } from "./hooks/useUserProfile";
import { usePlanSubscriptions } from "./hooks/usePlanSubscriptions";

export function AvailablePlansList() {
  const { data: userProfile } = useUserProfile();
  const { data: hasBusinessAccess } = useBusinessAccess(userProfile);
  const { data: plans, isLoading: plansLoading } = usePlans(hasBusinessAccess);

  const {
    isSubscribing,
    showUpgradeDialog,
    showCancelDialog,
    selectedPlan,
    proratedAmount,
    setShowUpgradeDialog,
    setShowCancelDialog,
    handlePlanChange,
    handleCancelPlan,
    handleUpgradePlan
  } = usePlanSubscriptions({ userProfile });

  const { data: activePlan, isLoading: activePlanLoading } = useQuery({
    queryKey: ["activePlan", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      const { data: subscription } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (
            id,
            name,
            description,
            monthly_cost,
            rules,
            plan_type,
            business_profiles (
              company_name
            )
          )
        `)
        .eq("user_id", userProfile.id)
        .eq("status", "active")
        .single();

      return subscription?.benefit_plans || null;
    },
    enabled: !!userProfile?.id
  });

  const isLoading = plansLoading || activePlanLoading;

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
        {activePlan && (
          <ActivePlanCard
            plan={activePlan}
            onCancelClick={() => setShowCancelDialog(true)}
          />
        )}
        {plans?.filter(plan => plan.id !== activePlan?.id).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSubscribing={isSubscribing}
            onSubscribe={handlePlanChange}
            CheckoutDialog={CancelDialog}
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
