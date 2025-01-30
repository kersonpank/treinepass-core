import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface PlanPreviewProps {
  plan: {
    name: string;
    description?: string;
    monthly_cost: string;
    plan_type: "corporate" | "individual" | "corporate_subsidized";
    period_type: "monthly" | "quarterly" | "semiannual" | "annual";
    status: "active" | "inactive";
    rules: Record<string, any>;
    subsidy_amount?: number;
    final_user_cost?: number;
    base_price?: number;
    platform_fee?: number;
    renewal_type?: "automatic" | "manual";
    payment_rules?: {
      continue_without_use: boolean;
    };
  };
}

const periodTypeLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

const planTypeLabels: Record<string, string> = {
  corporate: "Corporativo",
  individual: "Individual",
  corporate_subsidized: "Corporativo Subsidiado",
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
              {planTypeLabels[plan.plan_type]}
            </Badge>
            <Badge variant="secondary">{periodTypeLabels[plan.period_type]}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-2xl font-bold">
            {formatCurrency(Number(plan.monthly_cost))}
            <span className="text-sm font-normal text-muted-foreground">
              /{periodTypeLabels[plan.period_type].toLowerCase()}
            </span>
          </p>
          {plan.plan_type === "corporate_subsidized" && (
            <>
              <p className="text-sm text-muted-foreground">
                Subsídio da empresa: {formatCurrency(plan.subsidy_amount || 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Custo para usuário: {formatCurrency(plan.final_user_cost || 0)}
              </p>
            </>
          )}
          {plan.base_price && (
            <p className="text-sm text-muted-foreground">
              Preço base: {formatCurrency(plan.base_price)}
            </p>
          )}
          {plan.platform_fee && (
            <p className="text-sm text-muted-foreground">
              Taxa da plataforma: {plan.platform_fee}%
            </p>
          )}
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
          <div className="text-sm text-muted-foreground">
            <p>Renovação: {plan.renewal_type === "automatic" ? "Automática" : "Manual"}</p>
            <p>
              Cobrança sem uso:{" "}
              {plan.payment_rules?.continue_without_use ? "Continua" : "Pausa"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}