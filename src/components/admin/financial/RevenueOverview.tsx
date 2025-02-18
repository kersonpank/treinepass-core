
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { 
  CreditCard, 
  ArrowDownToLine, 
  BanknoteIcon,
  ArrowUpToLine 
} from "lucide-react";

export function RevenueOverview() {
  const { data: stats } = useQuery({
    queryKey: ["financial-stats"],
    queryFn: async () => {
      const [payments, transfers] = await Promise.all([
        supabase
          .from("asaas_payments")
          .select("amount, status")
          .in("status", ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]),
        supabase
          .from("asaas_transfers")
          .select("amount, status")
      ]);

      if (payments.error) throw payments.error;
      if (transfers.error) throw transfers.error;

      const totalReceived = payments.data.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalTransferred = transfers.data
        .filter(t => t.status === "COMPLETED")
        .reduce((acc, curr) => acc + Number(curr.amount), 0);
      const pendingTransfers = transfers.data
        .filter(t => t.status === "PENDING")
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      return {
        totalReceived,
        totalTransferred,
        pendingTransfers,
        totalPayments: payments.data.length
      };
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Recebido
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.totalReceived || 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Repassado
          </CardTitle>
          <ArrowUpToLine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.totalTransferred || 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Repasses Pendentes
          </CardTitle>
          <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.pendingTransfers || 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Pagamentos
          </CardTitle>
          <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.totalPayments || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
