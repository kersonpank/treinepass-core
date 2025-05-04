
import { Badge } from "@/components/ui/badge";

interface WebhookEventBadgeProps {
  status: string;
  gateway?: string;
}

export function WebhookEventBadge({ status, gateway }: WebhookEventBadgeProps) {
  if (gateway === "mercadopago") {
    switch (status) {
      case "processed":
        return <Badge variant="success">Processado</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="default">Recebido</Badge>;
    }
  }
  
  // Asaas e outros gateways
  switch (status) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return <Badge variant="success">Pago</Badge>;
    case "AWAITING_RISK_ANALYSIS":
    case "PENDING":
      return <Badge variant="default">Pendente</Badge>;
    case "OVERDUE":
      return <Badge variant="warning">Atrasado</Badge>;
    case "REFUNDED":
    case "REFUND_REQUESTED":
      return <Badge variant="outline">Reembolsado</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
