
import { ActivePlanCard } from "@/components/plans/components/ActivePlanCard";

interface CurrentSubscriptionProps {
  userSubscription: any;
  onCancel: (subscription: any) => void;
}

export function CurrentSubscription({ userSubscription, onCancel }: CurrentSubscriptionProps) {
  if (!userSubscription || userSubscription.status === 'cancelled') {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Seu plano atual</h3>
      <ActivePlanCard 
        plan={userSubscription.benefit_plans} 
        onCancelClick={() => onCancel(userSubscription)}
      />
    </div>
  );
}
