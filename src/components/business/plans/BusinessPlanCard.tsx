
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BusinessPlanCardProps {
  plan: any;
  onSubscribe: (planId: string) => Promise<void>;
  isSubscribing: boolean;
}

export function BusinessPlanCard({
  plan,
  onSubscribe,
  isSubscribing
}: BusinessPlanCardProps) {
  const handleSubscribe = () => {
    onSubscribe(plan.id);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <div className="text-2xl font-bold">
          {formatCurrency(plan.monthly_cost)}
          <span className="text-sm font-normal text-muted-foreground">/mês</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-muted-foreground mb-6 flex-1">{plan.description}</p>
        
        {plan.features && plan.features.length > 0 && (
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-medium">Recursos inclusos:</h4>
            <ul className="space-y-1">
              {plan.features.map((feature: string, index: number) => (
                <li key={index} className="text-sm flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <Button 
          onClick={handleSubscribe} 
          className="w-full mt-auto"
          disabled={isSubscribing}
        >
          {isSubscribing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Assinar Plano"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
