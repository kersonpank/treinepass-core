
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RevenueOverviewProps {
  academiaId: string;
}

export function RevenueOverview({ academiaId }: RevenueOverviewProps) {
  const { data: stats } = useQuery({
    queryKey: ["revenue-stats", academiaId],
    queryFn: async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data: financialMetrics } = await supabase.rpc(
        'calculate_financial_metrics',
        {
          p_start_date: firstDayOfMonth.toISOString(),
          p_end_date: lastDayOfMonth.toISOString()
        }
      );

      const { data: cyclesData } = await supabase
        .from('gym_payout_cycles')
        .select('*')
        .eq('academia_id', academiaId)
        .eq('status', 'active')
        .single();

      return {
        currentCycle: cyclesData,
        monthlyRevenue: financialMetrics?.total_revenue || 0,
        pendingTransfers: financialMetrics?.total_transfers || 0,
        totalFees: financialMetrics?.total_fees || 0,
        netRevenue: financialMetrics?.net_revenue || 0
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
            {formatCurrency(stats?.monthlyRevenue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Mês atual
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Repasses Pendentes
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.pendingTransfers || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total a repassar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ciclo Atual
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.currentCycle ? formatCurrency(stats.currentCycle.total_amount) : "R$ 0,00"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.currentCycle?.check_ins_count || 0} check-ins
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receita Líquida
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.netRevenue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Após taxas e repasses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
