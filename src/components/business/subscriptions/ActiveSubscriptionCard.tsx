
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CalendarDays, CheckCircle, XCircle, Users } from "lucide-react";

interface ActiveSubscriptionCardProps {
  subscription: any;
  onCancel: () => void;
}

export function ActiveSubscriptionCard({ subscription, onCancel }: ActiveSubscriptionCardProps) {
  const plan = subscription.benefit_plans;
  
  // Formatação de datas
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Definição de rótulos de status
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
      active: { label: "Ativo", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      overdue: { label: "Atrasado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" }
    };
    
    return statusMap[status] || { label: status, variant: "default" };
  };

  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
      paid: { label: "Pago", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      overdue: { label: "Atrasado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
      refunded: { label: "Reembolsado", variant: "outline" },
    };
    
    return statusMap[status] || { label: status, variant: "default" };
  };

  const statusInfo = getStatusLabel(subscription.status);
  const paymentStatusInfo = getPaymentStatusLabel(subscription.payment_status);

  const isPlanActive = subscription.status === "active";
  const isPending = subscription.payment_status === "pending";

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <Badge variant={paymentStatusInfo.variant}>
              Pagamento: {paymentStatusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Detalhes do Plano</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={plan.plan_type === 'corporate' ? 'default' : 'secondary'}>
                  {plan.plan_type === 'corporate' ? 'Corporativo' : 'Corporativo Subsidiado'}
                </Badge>
              </div>
              
              <p className="text-lg font-bold">
                {formatCurrency(Number(plan.monthly_cost))}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
              
              {plan.plan_type === 'corporate_subsidized' && plan.subsidy_amount && (
                <div className="text-sm">
                  <p>Subsídio: {formatCurrency(plan.subsidy_amount)}</p>
                  <p>Custo para o colaborador: {formatCurrency(Number(plan.monthly_cost) - plan.subsidy_amount)}</p>
                </div>
              )}

              {plan.employee_limit && (
                <p className="flex items-center gap-1.5 text-sm">
                  <Users className="h-4 w-4" />
                  Limite de {plan.employee_limit} colaboradores
                </p>
              )}
              
              <p className="flex items-center gap-1.5 text-sm">
                <CalendarDays className="h-4 w-4" />
                Data de início: {formatDate(subscription.start_date)}
              </p>
              
              {subscription.end_date && (
                <p className="flex items-center gap-1.5 text-sm">
                  <CalendarDays className="h-4 w-4" />
                  Data de término: {formatDate(subscription.end_date)}
                </p>
              )}

              {subscription.last_payment_date && (
                <p className="flex items-center gap-1.5 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Último pagamento: {formatDate(subscription.last_payment_date)}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Benefícios Inclusos</h3>
            <ul className="space-y-1.5">
              {plan.check_in_rules?.daily_limit && (
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Até {plan.check_in_rules.daily_limit} check-ins diários por colaborador</span>
                </li>
              )}
              {plan.check_in_rules?.monthly_limit && (
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Até {plan.check_in_rules.monthly_limit} check-ins mensais por colaborador</span>
                </li>
              )}
              {plan.check_in_rules?.allow_extra_checkins && (
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Check-ins extras permitidos {plan.check_in_rules?.extra_checkin_cost ? `(R$ ${plan.check_in_rules.extra_checkin_cost.toFixed(2)} cada)` : ''}</span>
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
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        {isPending && subscription.asaas_payment_link && (
          <Button 
            variant="outline" 
            onClick={() => window.open(subscription.asaas_payment_link, '_blank')}
          >
            Visualizar Pagamento Pendente
          </Button>
        )}
        
        {isPlanActive && (
          <Button 
            variant="destructive"
            onClick={onCancel}
          >
            Cancelar Plano
          </Button>
        )}
        
        {!isPlanActive && !isPending && (
          <p className="text-sm text-muted-foreground">
            Este plano não está mais ativo.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
