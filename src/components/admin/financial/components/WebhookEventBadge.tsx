
import { Badge } from "@/components/ui/badge";

interface WebhookEventBadgeProps {
  status: string | null;
  type: "status" | "processed";
  processedAt?: string;
}

export function WebhookEventBadge({ status, type, processedAt }: WebhookEventBadgeProps) {
  if (type === "processed") {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? (
          <>Sim {processedAt && 
            `(${new Date(processedAt).toLocaleTimeString('pt-BR')})`
          }</>
        ) : (
          "Não"
        )}
      </Badge>
    );
  }

  if (!status) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "RECEIVED":
      case "RECEIVED_IN_CASH":
        return "bg-green-100 text-green-700";
      case "PENDING":
      case "AWAITING_RISK_ANALYSIS":
      case "APPROVED_BY_RISK_ANALYSIS":
        return "bg-yellow-100 text-yellow-700";
      case "OVERDUE":
      case "DUNNING_REQUESTED":
      case "DUNNING_RECEIVED":
        return "bg-orange-100 text-orange-700";
      case "REFUNDED":
      case "REFUND_REQUESTED":
      case "REFUND_IN_PROGRESS":
      case "PARTIALLY_REFUNDED":
        return "bg-purple-100 text-purple-700";
      case "CANCELLED":
      case "PAYMENT_DELETED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const getPaymentStatus = (status: string) => {
    const statusMapping: Record<string, string> = {
      "CONFIRMED": "Confirmado",
      "RECEIVED": "Recebido",
      "RECEIVED_IN_CASH": "Recebido em Dinheiro",
      "PENDING": "Pendente",
      "AWAITING_RISK_ANALYSIS": "Aguardando Análise de Risco",
      "APPROVED_BY_RISK_ANALYSIS": "Aprovado na Análise de Risco",
      "OVERDUE": "Atrasado",
      "DUNNING_REQUESTED": "Cobrança Solicitada",
      "DUNNING_RECEIVED": "Cobrança Recebida",
      "REFUNDED": "Reembolsado",
      "REFUND_REQUESTED": "Reembolso Solicitado",
      "REFUND_IN_PROGRESS": "Reembolso em Processamento",
      "PARTIALLY_REFUNDED": "Parcialmente Reembolsado",
      "CANCELLED": "Cancelado",
      "PAYMENT_DELETED": "Pagamento Excluído"
    };

    return statusMapping[status] || status;
  };

  return (
    <Badge className={getStatusColor(status)}>
      {getPaymentStatus(status)}
    </Badge>
  );
}
