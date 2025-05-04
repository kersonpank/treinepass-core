
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface WebhookEventRowProps {
  event: any;
  onViewPayload: (event: any) => void;
  gatewayType?: string;
}

export function WebhookEventRow({ event, onViewPayload, gatewayType = "asaas" }: WebhookEventRowProps) {
  const formatEventType = (type: string) => {
    if (gatewayType === "mercadopago") {
      return type || "Desconhecido";
    }
    
    switch (type) {
      case "PAYMENT_CREATED":
        return "Pagamento Criado";
      case "PAYMENT_UPDATED":
        return "Pagamento Atualizado";
      case "PAYMENT_CONFIRMED":
        return "Pagamento Confirmado";
      case "PAYMENT_RECEIVED":
        return "Pagamento Recebido";
      case "PAYMENT_OVERDUE":
        return "Pagamento Atrasado";
      case "PAYMENT_DELETED":
        return "Pagamento Excluído";
      case "PAYMENT_REFUNDED":
        return "Pagamento Reembolsado";
      case "PAYMENT_RECEIVED_IN_CASH_UNDONE":
        return "Pagamento em Dinheiro Desfeito";
      case "PAYMENT_CHARGEBACK_REQUESTED":
        return "Chargeback Solicitado";
      case "PAYMENT_CHARGEBACK_DISPUTE":
        return "Disputa de Chargeback";
      case "PAYMENT_AWAITING_CHARGEBACK_REVERSAL":
        return "Aguardando Reversão de Chargeback";
      case "PAYMENT_DUNNING_RECEIVED":
        return "Dunning Recebido";
      case "PAYMENT_DUNNING_REQUESTED":
        return "Dunning Solicitado";
      case "PAYMENT_BANK_SLIP_VIEWED":
        return "Boleto Visualizado";
      case "PAYMENT_CHECKOUT_VIEWED":
        return "Checkout Visualizado";
      default:
        return type || "Desconhecido";
    }
  };

  const getPaymentId = () => {
    if (gatewayType === "mercadopago") {
      return event.event_id || "N/A";
    }
    return event.payment_id || "N/A";
  };

  const getStatus = () => {
    if (gatewayType === "mercadopago") {
      return event.status || "received";
    }
    return event.processed ? "processed" : "pending";
  };

  const getStatusColor = () => {
    const status = getStatus();
    
    if (gatewayType === "mercadopago") {
      if (status === "error") return "destructive";
      if (status === "processed") return "success";
      return "default";
    }
    
    return event.processed ? "success" : "default";
  };

  const getStatusText = () => {
    const status = getStatus();
    
    if (gatewayType === "mercadopago") {
      if (status === "error") return "Erro";
      if (status === "processed") return "Processado";
      return "Recebido";
    }
    
    return event.processed ? "Processado" : "Pendente";
  };
  
  const isValidSignature = () => {
    if (gatewayType === "mercadopago") {
      // Se signature_valid for null, consideramos como não validado
      return event.signature_valid === true;
    }
    
    return true; // Asaas não tem validação de assinatura
  };
  
  return (
    <TableRow>
      <TableCell>{formatDateTime(event.created_at || event.processed_at)}</TableCell>
      <TableCell>{formatEventType(event.event_type)}</TableCell>
      <TableCell>{getPaymentId()}</TableCell>
      <TableCell>
        <Badge variant={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </TableCell>
      <TableCell>
        {gatewayType === "mercadopago" && (
          <Badge variant={isValidSignature() ? "outline" : "destructive"}>
            {isValidSignature() ? "Válida" : "Inválida"}
          </Badge>
        )}
        {gatewayType !== "mercadopago" && (
          <Badge variant={event.error_message ? "destructive" : "outline"}>
            {event.error_message ? "Erro" : "OK"}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewPayload(event)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
