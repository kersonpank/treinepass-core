
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
  // Se não tiver uma assinatura ativa, não mostra os planos cofinanciados
  if (!hasActiveSubscription) {
    return (
      <div className="p-6 bg-muted/20 rounded-lg text-center">
        <h3 className="text-lg font-medium mb-2">Planos cofinanciados</h3>
        <p className="text-muted-foreground">
          Para oferecer planos cofinanciados aos seus colaboradores, é necessário ter um plano empresarial ativo.
        </p>
      </div>
    );
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
