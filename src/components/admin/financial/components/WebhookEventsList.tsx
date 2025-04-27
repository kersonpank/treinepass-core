
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WebhookEventRow } from "./WebhookEventRow";

interface WebhookEventsListProps {
  events: any[];
  onViewPayload: (event: any) => void;
}

export function WebhookEventsList({ events, onViewPayload }: WebhookEventsListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo de Evento</TableHead>
            <TableHead>ID do Pagamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Processado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events?.map((event) => (
            <WebhookEventRow 
              key={event.id} 
              event={event} 
              onViewPayload={onViewPayload} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
