
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ActivePlanCardProps {
  plan: any;
  onCancelClick: () => void;
}

export function ActivePlanCard({ plan, onCancelClick }: ActivePlanCardProps) {
  return (
    <Card className="flex flex-col bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <span>{plan.name}</span>
            <span className="ml-2 text-sm text-primary">Plano Atual</span>
          </div>
          <span className="text-2xl font-bold">
            {formatCurrency(plan.monthly_cost)}
            <span className="text-sm font-normal text-muted-foreground">/mês</span>
          </span>
        </CardTitle>
        {plan.plan_type === 'corporate_subsidized' && plan.business_profiles?.company_name && (
          <div className="text-sm text-muted-foreground">
            Plano subsidiado por {plan.business_profiles.company_name}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Benefícios inclusos:</h4>
          <ul className="space-y-2 text-sm">
            {Object.entries(plan.rules || {}).map(([key, value]) => (
              <li key={key} className="flex items-center">
                <span className="text-muted-foreground">{key}:</span>
                <span className="ml-1">{JSON.stringify(value)}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button 
          variant="destructive" 
          className="w-full"
          onClick={onCancelClick}
        >
          Cancelar Plano
        </Button>
      </CardContent>
    </Card>
  );
}
