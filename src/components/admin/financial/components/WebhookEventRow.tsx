
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { WebhookEventBadge } from "./WebhookEventBadge";
import { getEventTypeLabel, getNestedValue } from "../utils/webhook-utils";

interface WebhookEventRowProps {
  event: any;
  onViewPayload: (event: any) => void;
}

export function WebhookEventRow({ event, onViewPayload }: WebhookEventRowProps) {
  const paymentStatus = getNestedValue(event.payload, 'payment.status');
  const subscriptionStatus = getNestedValue(event.payload, 'subscription.status');
  const status = paymentStatus || subscriptionStatus;

  return (
    <TableRow key={event.id}>
      <TableCell>
        {new Date(event.created_at).toLocaleString('pt-BR')}
      </TableCell>
      <TableCell>{getEventTypeLabel(event.event_type)}</TableCell>
      <TableCell>{event.payment_id}</TableCell>
      <TableCell>
        <WebhookEventBadge status={status} type="status" />
      </TableCell>
      <TableCell>
        <WebhookEventBadge 
          status={event.processed ? "processed" : null} 
          type="processed" 
          processedAt={event.processed_at}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewPayload(event)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Payload
        </Button>
      </TableCell>
    </TableRow>
  );
}
