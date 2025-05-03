
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { WebhookEventBadge } from "./WebhookEventBadge";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WebhookEventRowProps {
  event: any;
  onViewPayload: (event: any) => void;
  gatewayType?: string;
}

export function WebhookEventRow({ event, onViewPayload, gatewayType = "asaas" }: WebhookEventRowProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  // Format event type differently based on gateway
  const getEventType = () => {
    if (gatewayType === "mercadopago") {
      return event.event_type || "Desconhecido";
    }

    // Default Asaas format
    return event.event_type || "Desconhecido";
  };

  // Get payment ID based on gateway
  const getPaymentId = () => {
    if (gatewayType === "mercadopago") {
      return event.event_id || "N/A";
    }

    // Default Asaas format
    return event.payment_id || "N/A"; 
  };

  // Get status based on gateway
  const getStatus = () => {
    if (gatewayType === "mercadopago") {
      return event.status || "received";
    }

    // Default Asaas format
    return event.status || "pending";
  };

  // Check if processed based on gateway
  const isProcessed = () => {
    if (gatewayType === "mercadopago") {
      return event.status === "processed";
    }

    // Default Asaas format
    return event.processed === true;
  };

  // Get processed time based on gateway
  const getProcessedTime = () => {
    if (gatewayType === "mercadopago") {
      return event.processed_at ? formatDate(event.processed_at) : "Pendente";
    }

    // Default Asaas format
    return event.processed_at ? formatDate(event.processed_at) : "Pendente";
  };

  return (
    <TableRow>
      <TableCell>{formatDate(event.created_at)}</TableCell>
      <TableCell>{getEventType()}</TableCell>
      <TableCell>{getPaymentId()}</TableCell>
      <TableCell>
        <WebhookEventBadge status={getStatus()} />
      </TableCell>
      <TableCell>{getProcessedTime()}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="ghost" onClick={() => onViewPayload(event)}>
          <Eye className="h-4 w-4 mr-1" />
          Ver Payload
        </Button>
      </TableCell>
    </TableRow>
  );
}
