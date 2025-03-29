
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function WebhookEventsMonitoring() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["webhookEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const handleViewPayload = (event: any) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-700";
    
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

  const getPaymentStatus = (status: string | null) => {
    if (!status) return "";

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Eventos de Webhook</CardTitle>
          <CardDescription>Monitoramento dos eventos recebidos do Asaas</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
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
                  <TableRow key={event.id}>
                    <TableCell>
                      {new Date(event.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{getEventTypeLabel(event.event_type)}</TableCell>
                    <TableCell>{event.payment_id}</TableCell>
                    <TableCell>
                      {event.payload?.payment?.status && (
                        <Badge className={getStatusColor(event.payload?.payment?.status)}>
                          {getPaymentStatus(event.payload?.payment?.status)}
                        </Badge>
                      )}
                      {event.payload?.subscription?.status && !event.payload?.payment?.status && (
                        <Badge className={getStatusColor(event.payload?.subscription?.status)}>
                          {getPaymentStatus(event.payload?.subscription?.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.processed ? "default" : "destructive"}>
                        {event.processed ? (
                          <>Sim {event.processed_at && 
                            `(${new Date(event.processed_at).toLocaleTimeString('pt-BR')})`
                          }</>
                        ) : (
                          "Não"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPayload(event)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Payload
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Payload do Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <pre className="text-xs overflow-auto max-h-[400px]">
                  {selectedEvent && JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
