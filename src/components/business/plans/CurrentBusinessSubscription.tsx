
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface CurrentBusinessSubscriptionProps {
  subscription: any;
  onCancel: (subscription: any) => void;
}

export function CurrentBusinessSubscription({ 
  subscription,
  onCancel 
}: CurrentBusinessSubscriptionProps) {
  // Retorna null se não houver assinatura ativa
  if (!subscription || subscription.status !== "active") {
    return null;
  }

  const plan = subscription.benefit_plans;
  const startDate = subscription.start_date ? new Date(subscription.start_date) : null;
  const endDate = subscription.end_date ? new Date(subscription.end_date) : null;

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Plano atual</CardTitle>
          <Badge>{subscription.status === "active" ? "Ativo" : subscription.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-muted-foreground">{plan.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor mensal</p>
            <p className="font-semibold">{formatCurrency(plan.monthly_cost)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de início</p>
            <p className="font-semibold">{startDate ? startDate.toLocaleDateString('pt-BR') : "N/A"}</p>
          </div>
          {endDate && (
            <div>
              <p className="text-sm text-muted-foreground">Data de término</p>
              <p className="font-semibold">{endDate.toLocaleDateString('pt-BR')}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => onCancel(subscription)}
        >
          Cancelar plano
        </Button>
      </CardFooter>
    </Card>
  );
}
