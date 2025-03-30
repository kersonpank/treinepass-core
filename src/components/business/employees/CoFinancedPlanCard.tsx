
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{plan.name}</span>
          <span className="text-xl font-bold">
            {formatCurrency(plan.monthly_cost)}
            <span className="text-sm font-normal text-muted-foreground">/mês</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground flex-1">{plan.description}</p>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Benefícios inclusos:</h4>
            <ul className="space-y-1 text-sm">
              {Object.entries(plan.rules || {}).map(([key, value]) => (
                <li key={key} className="flex items-center">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="ml-1">{JSON.stringify(value)}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <Button
            className="w-full"
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
