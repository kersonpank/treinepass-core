
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const statusMap = {
  PENDING: { label: "Pendente", variant: "secondary" },
  RECEIVED: { label: "Recebido", variant: "default" },
  CONFIRMED: { label: "Confirmado", variant: "default" },
  OVERDUE: { label: "Atrasado", variant: "destructive" },
  REFUNDED: { label: "Reembolsado", variant: "secondary" },
  RECEIVED_IN_CASH: { label: "Recebido em Dinheiro", variant: "default" },
  REFUND_REQUESTED: { label: "Reembolso Solicitado", variant: "warning" },
  CHARGEBACK_REQUESTED: { label: "Chargeback Solicitado", variant: "warning" },
  CHARGEBACK_DISPUTE: { label: "Em Disputa", variant: "warning" },
  AWAITING_CHARGEBACK_REVERSAL: { label: "Aguardando Reversão", variant: "warning" },
  DUNNING_REQUESTED: { label: "Cobrança Solicitada", variant: "warning" },
  CANCELED: { label: "Cancelado", variant: "secondary" }
} as const;

export function PaymentsList() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_payments")
        .select(`
          *,
          customer:asaas_customers(name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Vencimento</TableHead>
            <TableHead>Data Pagamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments?.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span>{payment.customer?.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {payment.customer?.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                <Badge variant={statusMap[payment.status]?.variant as any}>
                  {statusMap[payment.status]?.label}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(payment.due_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {payment.payment_date ? 
                  new Date(payment.payment_date).toLocaleDateString() : 
                  "-"
                }
              </TableCell>
              <TableCell className="text-right">
                {payment.invoice_url && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => window.open(payment.invoice_url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
