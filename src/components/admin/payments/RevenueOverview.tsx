
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function RevenueOverview() {
  const { data: revenue } = useQuery({
    queryKey: ["revenue-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_payments")
        .select(`
          amount,
          status,
          payment_date,
          due_date
        `);

      if (error) throw error;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalReceived = data
        .filter(payment => payment.status === "RECEIVED" || payment.status === "CONFIRMED")
        .reduce((sum, payment) => sum + payment.amount, 0);

      const monthlyRevenue = data
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date || payment.due_date);
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear &&
                 (payment.status === "RECEIVED" || payment.status === "CONFIRMED");
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

      const pendingAmount = data
        .filter(payment => payment.status === "PENDING")
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        totalReceived,
        monthlyRevenue,
        pendingAmount
      };
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receita Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(revenue?.totalReceived || 0)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receita Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(revenue?.monthlyRevenue || 0)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valores Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(revenue?.pendingAmount || 0)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
