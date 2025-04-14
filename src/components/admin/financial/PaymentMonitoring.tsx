
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    RECEIVED: "bg-green-100 text-green-800",
    RECEIVED_IN_CASH: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    REFUNDED: "bg-purple-100 text-purple-800",
    REFUND_REQUESTED: "bg-purple-100 text-purple-800",
    CHARGEBACK_REQUESTED: "bg-red-100 text-red-800",
    CHARGEBACK_DISPUTE: "bg-red-100 text-red-800",
    AWAITING_RISK_ANALYSIS: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  
  return statusMap[status] || "bg-gray-100 text-gray-800";
};

export function PaymentMonitoring() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ["payments_monitoring"],
    queryFn: async () => {
      // Modified query to use proper join with separate queries to avoid relation errors
      const { data, error } = await supabase
        .from("asaas_payments")
        .select(`
          *
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch additional data separately
      const paymentsWithDetails = await Promise.all(
        data.map(async (payment) => {
          // Get customer data
          const { data: customerData } = await supabase
            .from("asaas_customers")
            .select("name, email, cpf_cnpj")
            .eq("id", payment.customer_id)
            .maybeSingle();

          // Get subscription data
          const { data: subscriptionData } = await supabase
            .from("user_plan_subscriptions")
            .select(`
              id,
              user_id,
              plan_id
            `)
            .eq("id", payment.subscription_id)
            .maybeSingle();

          // Get plan data if subscription exists
          let planData = null;
          if (subscriptionData?.plan_id) {
            const { data: planInfo } = await supabase
              .from("benefit_plans")
              .select("name")
              .eq("id", subscriptionData.plan_id)
              .maybeSingle();
            
            planData = planInfo;
          }

          return {
            ...payment,
            asaas_customers: customerData,
            user_plan_subscriptions: subscriptionData ? {
              id: subscriptionData.id,
              user_id: subscriptionData.user_id,
              plan_id: subscriptionData.plan_id,
              benefit_plans: planData
            } : null
          };
        })
      );

      return paymentsWithDetails;
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      BOLETO: "Boleto",
      CREDIT_CARD: "Cartão de Crédito",
      PIX: "PIX",
      UNDEFINED: "A definir no checkout",
    };
    
    return methodMap[method] || method;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monitoramento de Pagamentos</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!payments || payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.asaas_customers?.name || "N/A"}
                      <div className="text-xs text-muted-foreground">
                        {payment.asaas_customers?.email || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.user_plan_subscriptions?.benefit_plans?.name || "N/A"}
                      <div className="text-xs text-muted-foreground">
                        {payment.subscription_id || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.billing_type)}</TableCell>
                    <TableCell>{formatDate(payment.due_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(payment.status)}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.payment_date 
                        ? formatDate(payment.payment_date) 
                        : "Pendente"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
