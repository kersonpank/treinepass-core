
import { CoFinancedPlanCard } from "./CoFinancedPlanCard";

interface AvailableCofinancedPlansProps {
  availablePlans: any[];
  hasActiveSubscription: boolean;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => Promise<void>;
}

export function AvailableCofinancedPlans({ 
  availablePlans, 
  hasActiveSubscription,
  isSubscribing, 
  onSubscribe 
}: AvailableCofinancedPlansProps) {
  if (hasActiveSubscription) {
    return null;
  }

  return (
    <>
      <h3 className="text-lg font-medium mb-4">Planos cofinanciados disponíveis</h3>
      {availablePlans && availablePlans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePlans.map((plan) => (
            <CoFinancedPlanCard
              key={plan.id}
              plan={plan}
              isSubscribing={isSubscribing}
              onSubscribe={onSubscribe}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum plano cofinanciado disponível no momento.</p>
      )}
    </>
  );
}
