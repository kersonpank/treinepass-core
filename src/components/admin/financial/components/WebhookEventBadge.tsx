
import { Badge } from "@/components/ui/badge";

interface WebhookEventBadgeProps {
  status: string;
  gateway?: string;
}

export function WebhookEventBadge({ status, gateway }: WebhookEventBadgeProps) {
  if (gateway === "mercadopago") {
    switch (status) {
      case "processed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Processado</Badge>;
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
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Pago</Badge>;
    case "AWAITING_RISK_ANALYSIS":
    case "PENDING":
      return <Badge variant="default">Pendente</Badge>;
    case "OVERDUE":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Atrasado</Badge>;
    case "REFUNDED":
    case "REFUND_REQUESTED":
      return <Badge variant="outline">Reembolsado</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
