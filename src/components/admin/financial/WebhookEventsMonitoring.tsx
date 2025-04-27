
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { WebhookEventsList } from "./components/WebhookEventsList";
import { PayloadDialog } from "./components/PayloadDialog";

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
          <WebhookEventsList 
            events={events || []} 
            onViewPayload={handleViewPayload} 
          />
        )}

        <PayloadDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          payload={selectedEvent?.payload}
        />
      </CardContent>
    </Card>
  );
}
