
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const statusColors = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  refunded: "bg-purple-100 text-purple-700",
};

const statusLabels = {
  active: "Ativo",
  pending: "Pendente",
  overdue: "Vencido",
  expired: "Expirado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const paymentStatusColors = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-amber-100 text-amber-700",
  refunded: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

const paymentStatusLabels = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Atrasado",
  refunded: "Reembolsado",
  failed: "Falhou",
};

export function UserSubscriptions() {
  const { toast } = useToast();

  const { data: subscriptions, isLoading, error, refetch } = useQuery({
    queryKey: ["userSubscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (
            name,
            description,
            monthly_cost,
            rules
          ),
          asaas_payments (
            asaas_id,
            amount,
            billing_type,
            status,
            due_date,
            payment_link,
            invoice_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar assinaturas",
          description: error.message,
        });
        throw error;
      }
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Erro ao carregar assinaturas. Por favor, tente novamente.
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Você ainda não possui nenhuma assinatura.
        </CardContent>
      </Card>
    );
  }

  const refreshSubscriptions = async () => {
    toast({
      title: "Atualizando...",
      description: "Verificando status de suas assinaturas",
    });
    
    await refetch();
    
    toast({
      title: "Atualizado",
      description: "Status de assinaturas atualizado",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={refreshSubscriptions} variant="outline" size="sm">
          Atualizar Status
        </Button>
      </div>
      
      {subscriptions.map((subscription) => {
        // Find the latest payment
        const latestPayment = subscription.asaas_payments?.length > 0 
          ? subscription.asaas_payments.reduce((latest, current) => {
              return new Date(current.due_date) > new Date(latest.due_date) ? current : latest;
            })
          : null;
        
        const hasPaymentLink = !!(
          subscription.asaas_payment_link || 
          latestPayment?.payment_link || 
          latestPayment?.invoice_url
        );

        return (
          <Card key={subscription.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{subscription.benefit_plans.name}</CardTitle>
                <Badge className={statusColors[subscription.status] || statusColors.pending}>
                  {statusLabels[subscription.status] || "Pendente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor mensal:</span>
                <span className="font-medium">
                  {formatCurrency(subscription.benefit_plans.monthly_cost)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status de pagamento:</span>
                <span className="font-medium">
                  <Badge className={paymentStatusColors[subscription.payment_status] || paymentStatusColors.pending}>
                    {paymentStatusLabels[subscription.payment_status] || "Pendente"}
                  </Badge>
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Início:</span>
                <span>{new Date(subscription.start_date).toLocaleDateString()}</span>
              </div>
              
              {subscription.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Término:</span>
                  <span>{new Date(subscription.end_date).toLocaleDateString()}</span>
                </div>
              )}
              
              {subscription.last_payment_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Último pagamento:</span>
                  <span>{new Date(subscription.last_payment_date).toLocaleDateString()}</span>
                </div>
              )}
              
              {subscription.next_payment_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Próximo pagamento:</span>
                  <span>{new Date(subscription.next_payment_date).toLocaleDateString()}</span>
                </div>
              )}
              
              {/* Display payment button if payment is pending */}
              {(subscription.payment_status === 'pending' || subscription.payment_status === 'overdue') && hasPaymentLink && (
                <div className="mt-4">
                  <a 
                    href={subscription.asaas_payment_link || latestPayment?.payment_link || latestPayment?.invoice_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-primary text-white rounded-md py-2 mt-2 hover:bg-primary/90 transition-colors"
                  >
                    Realizar Pagamento
                  </a>
                </div>
              )}
              
              {/* Display payment history button if subscription is active and has payments */}
              {subscription.status === 'active' && subscription.asaas_payments?.length > 0 && (
                <div className="mt-2 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      toast({
                        title: "Em breve",
                        description: "Histórico de pagamentos estará disponível em breve",
                      });
                    }}
                  >
                    Ver histórico de pagamentos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
