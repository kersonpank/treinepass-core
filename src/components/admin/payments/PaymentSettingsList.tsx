
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
import { Switch } from "@/components/ui/switch";
import type { PaymentSetting } from "./types/payment";

export function PaymentSettingsList() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_payment_settings")
        .select(`
          *,
          benefit_plans (
            name
          )
        `);

      if (error) throw error;
      return data as PaymentSetting[];
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
            <TableHead>Plano</TableHead>
            <TableHead>Tipo de Cobrança</TableHead>
            <TableHead>Dia de Vencimento</TableHead>
            <TableHead>Retentativa Automática</TableHead>
            <TableHead>Máximo de Tentativas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings?.map((setting) => (
            <TableRow key={setting.id}>
              <TableCell>{setting.benefit_plans?.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {setting.billing_type === "PREPAID" ? "Pré-pago" : "Pós-pago"}
                </Badge>
              </TableCell>
              <TableCell>{setting.due_day}</TableCell>
              <TableCell>
                <Switch 
                  checked={setting.automatic_retry}
                  disabled
                />
              </TableCell>
              <TableCell>{setting.max_retry_attempts}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
