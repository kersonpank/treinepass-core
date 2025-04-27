import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";

interface CoFinancedPlanCardProps {
  plan: any;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => Promise<void>;
}

export function CoFinancedPlanCard({
  plan,
  isSubscribing,
  onSubscribe,
}: CoFinancedPlanCardProps) {
  const handleSubscribe = () => {
    onSubscribe(plan.id);
  };

  if (!plan) {
    return <LoadingSpinner size="sm" text="Carregando informações do plano..." />;
  }

  // Get subsidy amount and user final cost if available
  const subsidyAmount = plan.subsidy_amount || 0;
  const userCost = plan.user_final_cost || plan.monthly_cost;
  const hasSubsidy = subsidyAmount > 0;

  return (
    <Card className="flex flex-col h-full border-green-200 bg-green-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>{plan.name}</span>
            <Badge className="bg-green-500 text-white text-xs">Cofinanciado</Badge>
          </CardTitle>
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-xl font-bold">
            {formatCurrency(userCost)}
          </span>
          <span className="text-sm font-normal text-muted-foreground">/mês</span>
          {hasSubsidy && (
            <span className="text-xs text-green-600 ml-2">
              (Empresa paga: {formatCurrency(subsidyAmount)})
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground flex-1">{plan.description}</p>
        
        <div className="space-y-4 mt-4">
          {plan.rules && Object.keys(plan.rules).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Benefícios inclusos:</h4>
              <ul className="space-y-1 text-sm">
                {Object.entries(plan.rules).map(([key, value]) => (
                  <li key={key} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="ml-1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-green-100 rounded-md p-3">
            <h4 className="text-sm font-medium mb-1">Informações do plano cofinanciado:</h4>
            <p className="text-xs text-muted-foreground">
              Este plano é cofinanciado pela sua empresa. 
              {hasSubsidy ? 
                ` A empresa paga ${formatCurrency(subsidyAmount)} e você paga ${formatCurrency(userCost)}.` : 
                ' Entre em contato com seu RH para mais informações.'}
            </p>
          </div>
          
          <Button
            className="w-full mt-2"
            onClick={handleSubscribe}
            disabled={isSubscribing}
          >
            {isSubscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Contratar Plano"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
