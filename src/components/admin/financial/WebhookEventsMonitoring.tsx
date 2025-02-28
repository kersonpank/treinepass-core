
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function WebhookEventsMonitoring() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewPayload, setViewPayload] = useState<any>(null);

  const { data: webhookEvents, isLoading, refetch } = useQuery({
    queryKey: ["webhook_events_monitoring"],
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Eventos de Webhook</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo de Evento</TableHead>
                  <TableHead>ID Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookEvents?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum evento de webhook encontrado
                    </TableCell>
                  </TableRow>
                )}
                {webhookEvents?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{formatDate(event.created_at)}</TableCell>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell>{event.payment_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.processed ? (
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs">
                            {event.processed_at
                              ? formatDate(event.processed_at)
                              : "Sim"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-xs">Não</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewPayload(event.payload)}
                      >
                        Ver Payload
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewPayload} onOpenChange={(open) => !open && setViewPayload(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Dados do Evento</DialogTitle>
            <DialogDescription>
              Informações completas recebidas do webhook
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-slate-100 p-4 rounded-md overflow-auto text-xs max-h-[60vh] whitespace-pre-wrap">
            {JSON.stringify(viewPayload, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
