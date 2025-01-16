import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface PlanPreviewProps {
  plan: {
    name: string;
    description?: string;
    monthly_cost: string;
    plan_type: "corporate" | "individual";
    period_type: "monthly" | "quarterly" | "semiannual" | "annual";
    status: "active" | "inactive";
    rules: Record<string, any>;
  };
}

const periodTypeLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

export function PlanPreview({ plan }: PlanPreviewProps) {
  const formatRuleValue = (rule: any) => {
    if (rule.limit) {
      return `${rule.limit} por ${rule.period === "month" ? "mês" : "período"}`;
    }
    if (rule.start && rule.end) {
      return `${rule.start} às ${rule.end}`;
    }
    return JSON.stringify(rule);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {plan.plan_type === "corporate" ? "Corporativo" : "Individual"}
            </Badge>
            <Badge variant="secondary">{periodTypeLabels[plan.period_type]}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-2xl font-bold">
            {formatCurrency(Number(plan.monthly_cost))}
            <span className="text-sm font-normal text-muted-foreground">
              /{periodTypeLabels[plan.period_type].toLowerCase()}
            </span>
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Regras do Plano</h4>
          <ul className="space-y-2">
            {Object.entries(plan.rules).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{key}</span>
                <span>{formatRuleValue(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}