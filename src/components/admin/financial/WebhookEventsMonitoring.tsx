
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
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  const handleViewPayload = (event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Eventos de Webhook</CardTitle>
            <CardDescription>Monitoramento dos eventos recebidos do Asaas</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
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
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell>{event.payment_id}</TableCell>
                    <TableCell>
                      {event.status && (
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.processed ? "default" : "destructive"}>
                        {event.processed ? (
                          <>Sim {event.processed_at && 
                            `(${new Date(event.processed_at).toLocaleTimeString()})`
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
