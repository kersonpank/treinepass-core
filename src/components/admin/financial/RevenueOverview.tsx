import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, Calendar } from "lucide-react";

export function RevenueOverview() {
  const { data: stats } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data: monthlyRevenue } = await supabase
        .from("payments")
        .select("amount")
        .gte("payment_date", firstDayOfMonth.toISOString())
        .lte("payment_date", lastDayOfMonth.toISOString())
        .eq("status", "paid");

      const { data: pendingPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "pending");

      const totalMonthly = monthlyRevenue?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const totalPending = pendingPayments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      return {
        monthlyRevenue: totalMonthly,
        pendingPayments: totalPending,
        activeBusinesses: 0, // To be implemented
        averageTicket: totalMonthly / (monthlyRevenue?.length || 1),
      };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Faturamento Mensal
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats?.monthlyRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Mês atual
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pagamentos Pendentes
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats?.pendingPayments.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total pendente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Empresas Ativas
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            Total de clientes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ticket Médio
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats?.averageTicket.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Por empresa
          </p>
        </CardContent>
      </Card>
    </div>
  );
}