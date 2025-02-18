
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
import { formatCurrency } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export function TransferRulesList() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ["transfer-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_rules")
        .select("*");

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
            <TableHead>Valor Mínimo</TableHead>
            <TableHead>Dia do Repasse</TableHead>
            <TableHead>Repasse Automático</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules?.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>{formatCurrency(rule.minimum_transfer_amount)}</TableCell>
              <TableCell>{rule.transfer_day}</TableCell>
              <TableCell>
                <Switch 
                  checked={rule.automatic_transfer}
                  disabled
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
