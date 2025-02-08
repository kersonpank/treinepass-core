
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
import { Badge } from "@/components/ui/badge";
import { CheckInHistoryItem } from "@/types/check-in";

interface CheckInsTableProps {
  checkIns: CheckInHistoryItem[];
}

export function CheckInsTable({ checkIns }: CheckInsTableProps) {
  const getValidationMethodLabel = (method: string) => {
    switch (method) {
      case 'qr_code':
        return 'QR Code';
      case 'access_token':
        return 'Código Manual';
      case 'automatic':
        return 'Automático';
      default:
        return method;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor Repasse</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkIns?.map((checkIn) => (
            <TableRow key={checkIn.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {checkIn.user?.full_name || "Usuário não encontrado"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {checkIn.user?.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>{checkIn.user?.cpf}</TableCell>
              <TableCell>
                {format(new Date(checkIn.check_in_time), "PPpp", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getValidationMethodLabel(checkIn.validation_method)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={checkIn.check_out_time ? "secondary" : "default"}
                >
                  {checkIn.check_out_time ? "Finalizado" : "Ativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                R$ {checkIn.valor_repasse?.toFixed(2) || "0.00"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
