
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { WebhookEventBadge } from "./WebhookEventBadge";

interface WebhookEventRowProps {
  event: any;
  onViewPayload: (event: any) => void;
}

export function WebhookEventRow({ event, onViewPayload }: WebhookEventRowProps) {
  const getEventTypeLabel = (eventType: string) => {
    const typeMapping: Record<string, string> = {
      "PAYMENT_CREATED": "Pagamento Criado",
      "PAYMENT_UPDATED": "Pagamento Atualizado",
      "PAYMENT_CONFIRMED": "Pagamento Confirmado",
      "PAYMENT_RECEIVED": "Pagamento Recebido",
      "PAYMENT_OVERDUE": "Pagamento Atrasado",
      "PAYMENT_DELETED": "Pagamento Excluído",
      "PAYMENT_REFUNDED": "Pagamento Reembolsado",
      "PAYMENT_RECEIVED_IN_CASH": "Pagamento Recebido em Dinheiro",
      "PAYMENT_REFUND_REQUESTED": "Reembolso Solicitado",
      "SUBSCRIPTION_CREATED": "Assinatura Criada",
      "SUBSCRIPTION_UPDATED": "Assinatura Atualizada",
      "SUBSCRIPTION_DELETED": "Assinatura Excluída",
      "SUBSCRIPTION_RENEWED": "Assinatura Renovada"
    };

    return typeMapping[eventType] || eventType;
  };

  const getNestedValue = (obj: any, path: string, defaultValue: any = null) => {
    try {
      if (!obj || typeof obj !== 'object') return defaultValue;
      
      const keys = path.split('.');
      let result = obj;
      
      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key];
        } else {
          return defaultValue;
        }
      }
      
      return result || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

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
