
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CoFinancedPlanCardProps {
  plan: any;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => Promise<void>;
}

export function CoFinancedPlanCard({ plan, isSubscribing, onSubscribe }: CoFinancedPlanCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Calcula o valor subsidiado
  const subsidizedAmount = plan.subsidy_amount || 0;
  const userFinalCost = Number(plan.monthly_cost) - subsidizedAmount;

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      await onSubscribe(plan.id);
    } catch (error) {
      console.error("Erro ao assinar plano:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error instanceof Error ? error.message : "Erro desconhecido ao processar sua solicitação",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          <Badge>Plano Subsidiado</Badge>
        </div>
        
        <div className="mt-4 space-y-1">
          <div>
            <p className="text-muted-foreground text-sm">Valor total:</p>
            <p className="text-2xl font-bold line-through text-muted-foreground">
              {formatCurrency(Number(plan.monthly_cost))}
              <span className="text-sm font-normal">/mês</span>
            </p>
          </div>
          
          <div>
            <p className="text-muted-foreground text-sm">Subsídio da empresa:</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(subsidizedAmount)}
            </p>
          </div>
          
          <div>
            <p className="text-muted-foreground text-sm">Você paga apenas:</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(userFinalCost)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4 mb-6">
          <h3 className="font-medium">Benefícios inclusos:</h3>
          <ul className="space-y-2">
            {plan.check_in_rules?.daily_limit && (
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                <span>Até {plan.check_in_rules.daily_limit} check-ins diários</span>
              </li>
            )}
            {plan.check_in_rules?.monthly_limit && (
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                <span>Até {plan.check_in_rules.monthly_limit} check-ins mensais</span>
              </li>
            )}
            {Object.entries(plan.rules || {}).map(([key, value]) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                <span>{key}: {JSON.stringify(value)}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleSubscribe} 
          disabled={isSubscribing || isLoading}
        >
          {(isSubscribing || isLoading) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Processando...
            </>
          ) : (
            'Contratar Plano'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
