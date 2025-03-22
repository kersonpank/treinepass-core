import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from '@supabase/supabase-js';

interface WebhookEvent {
  id: string;
  event_type: string;
  event_data: any;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
  error_message?: string | null;
  retry_count?: number;
}

interface ReprocessResponse {
  success: boolean;
  message: string;
}

export function WebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Criar um cliente Supabase com permissões de administrador usando as variáveis de ambiente do Vite
  const adminSupabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const fetchEvents = async () => {
    setLoading(true);
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Não autenticado",
          description: "Você precisa estar autenticado para ver os eventos de webhook.",
        });
        setEvents([]);
        setLoading(false);
        return;
      }

      // Verificar se a tabela existe antes de fazer a consulta
      const { error: tableCheckError } = await adminSupabase
        .from('asaas_webhook_events')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error("Erro ao verificar tabela de eventos:", tableCheckError);
        toast({
          variant: "destructive",
          title: "Tabela não encontrada",
          description: "A tabela de eventos de webhook ainda não foi criada ou não está acessível.",
        });
        setEvents([]);
        setLoading(false);
        return;
      }

      let query = adminSupabase
        .from("asaas_webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (activeTab === "errors") {
        query = query.or("processed.eq.false,error_message.not.is.null");
      } else if (activeTab === "success") {
        query = query.eq("processed", true).is("error_message", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar eventos de webhook:", error);
        toast({
          variant: "destructive",
          title: "Erro ao buscar eventos",
          description: error.message,
        });
      } else {
        // Garantir que todos os campos estejam presentes no objeto
        const processedEvents = (data || []).map(event => ({
          ...event,
          error_message: event.error_message || null,
          retry_count: event.retry_count || 0
        })) as WebhookEvent[];
        
        setEvents(processedEvents);
      }
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
      toast({
        variant: "destructive",
        title: "Erro ao buscar eventos",
        description: "Ocorreu um erro ao buscar os eventos de webhook.",
      });
    } finally {
      setLoading(false);
    }
  };

  const reprocessEvent = async (eventId: string) => {
    setProcessingEvent(eventId);
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Não autenticado",
          description: "Você precisa estar autenticado para reprocessar eventos.",
        });
        return;
      }

      // Verificar se a função existe
      const functionResponse = await adminSupabase.rpc("reprocess_failed_webhook_event", {
        event_id: eventId,
      });

      if (functionResponse.error) {
        console.error("Erro ao reprocessar evento:", functionResponse.error);
        toast({
          variant: "destructive",
          title: "Erro ao reprocessar evento",
          description: functionResponse.error.message,
        });
      } else {
        const data = functionResponse.data as ReprocessResponse;
        toast({
          title: "Evento reprocessado",
          description: data.success
            ? "Evento reprocessado com sucesso."
            : `Erro: ${data.message}`,
          variant: data.success ? "default" : "destructive",
        });
        fetchEvents();
      }
    } catch (err) {
      console.error("Erro ao reprocessar evento:", err);
      toast({
        variant: "destructive",
        title: "Erro ao reprocessar evento",
        description: "Ocorreu um erro ao reprocessar o evento.",
      });
    } finally {
      setProcessingEvent(null);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const getEventStatusBadge = (event: WebhookEvent) => {
    if (event.processed && !event.error_message) {
      return <Badge className="bg-green-500">Processado</Badge>;
    } else if (!event.processed && event.retry_count > 0) {
      return <Badge className="bg-amber-500">Falha ({event.retry_count}x)</Badge>;
    } else if (!event.processed) {
      return <Badge className="bg-red-500">Erro</Badge>;
    } else {
      return <Badge className="bg-slate-500">Desconhecido</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getPaymentStatus = (event: WebhookEvent) => {
    if (event.event_type.startsWith("PAYMENT_")) {
      return event.event_data?.payment?.status || "N/A";
    } else if (event.event_type.startsWith("SUBSCRIPTION_")) {
      return event.event_data?.subscription?.status || "N/A";
    }
    return "N/A";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Eventos de Webhook</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </CardTitle>
        <CardDescription>
          Monitoramento de eventos de webhook recebidos do Asaas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="success">Sucesso</TabsTrigger>
            <TabsTrigger value="errors">Erros</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum evento encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Status Pagamento</TableHead>
                      <TableHead>Erro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(event.created_at)}
                        </TableCell>
                        <TableCell>{formatEventType(event.event_type)}</TableCell>
                        <TableCell>{getEventStatusBadge(event)}</TableCell>
                        <TableCell>{getPaymentStatus(event)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {event.error_message || (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!event.processed || event.error_message ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reprocessEvent(event.id)}
                              disabled={processingEvent === event.id}
                            >
                              {processingEvent === event.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                              )}
                              Reprocessar
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
