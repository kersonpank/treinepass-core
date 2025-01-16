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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Payment {
  id: string;
  business_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_date: string | null;
  due_date: string;
  business_profiles: {
    company_name: string;
  };
}

export function PaymentsList() {
  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          business_profiles (
            company_name
          )
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Método</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.business_profiles.company_name}
                </TableCell>
                <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      payment.status === "paid"
                        ? "success"
                        : payment.status === "pending"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {payment.status === "paid"
                      ? "Pago"
                      : payment.status === "pending"
                      ? "Pendente"
                      : "Atrasado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(payment.due_date), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  {payment.payment_date
                    ? format(new Date(payment.payment_date), "dd/MM/yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  {payment.payment_method || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}