
import { Badge } from "@/components/ui/badge";

interface WebhookEventBadgeProps {
  status: string;
  type?: string;
}

export function WebhookEventBadge({ status, type = "status" }: WebhookEventBadgeProps) {
  // Determinar variante baseado no status
  const getVariant = () => {
    // Para status do Mercado Pago
    if (type === "mercadopago") {
      switch (status) {
        case "processed":
          return "success";
        case "error":
          return "destructive";
        case "reprocessing":
          return "warning";
        case "received":
          return "warning";
        default:
          return "default";
      }
    }
    
    // Para status do Asaas (padrão)
    switch (status) {
      case "CONFIRMED":
      case "RECEIVED":
      case "RECEIVED_IN_CASH":
      case "processed":
      case "paid":
      case "approved":
        return "success";
      case "PENDING":
      case "AWAITING_RISK_ANALYSIS":
      case "pending":
      case "in_process":
      case "received":
        return "warning";
      case "OVERDUE":
      case "overdue":
      case "rejected":
        return "destructive";
      case "REFUNDED":
      case "REFUND_REQUESTED":
      case "refunded":
        return "secondary";
      case "CANCELLED":
      case "cancelled":
        return "outline";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Badge variant={getVariant() as any}>
      {status}
    </Badge>
  );
}
