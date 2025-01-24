import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export function CheckInHistory() {
  const { data: checkIns, isLoading } = useQuery({
    queryKey: ["check-ins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_usage")
        .select(`
          *,
          user_profiles:employee_id (
            full_name
          )
        `)
        .order("check_in", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Carregando histórico...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkIns?.map((checkIn) => (
            <TableRow key={checkIn.id}>
              <TableCell>
                {checkIn.user_profiles?.full_name || "Usuário não encontrado"}
              </TableCell>
              <TableCell>
                {format(new Date(checkIn.check_in), "PPpp", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {checkIn.validation_method === "qr_code"
                    ? "QR Code"
                    : "Código Manual"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={checkIn.check_out ? "secondary" : "default"}
                >
                  {checkIn.check_out ? "Finalizado" : "Ativo"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}