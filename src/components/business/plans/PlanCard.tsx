
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Check } from "lucide-react";

interface PlanCardProps {
  plan: any;
  subscription: any;
}

export function PlanCard({ plan, subscription }: PlanCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          <Badge>{subscription.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{formatCurrency(plan.monthly_cost)}</span>
              <span className="ml-2 text-sm text-muted-foreground">/mês</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Recursos inclusos:</h4>
            <ul className="space-y-2">
              {Object.entries(plan.rules || {}).map(([key, value]) => (
                <li key={key} className="flex items-center text-sm">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  <span>{key}: {JSON.stringify(value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Detalhes da assinatura:</h4>
            <div className="text-sm space-y-1">
              <p>Início: {new Date(subscription.start_date).toLocaleDateString()}</p>
              {subscription.end_date && (
                <p>Término: {new Date(subscription.end_date).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
