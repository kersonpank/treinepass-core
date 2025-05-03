
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WebhookEventsMonitoring() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("asaas");

  // Consulta para eventos do Asaas
  const { data: asaasEvents, isLoading: isLoadingAsaas, refetch: refetchAsaas } = useQuery({
    queryKey: ["asaasWebhookEvents"],
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

  // Consulta para eventos do Mercado Pago
  const { data: mpEvents, isLoading: isLoadingMP, refetch: refetchMP } = useQuery({
    queryKey: ["mercadopagoWebhookEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mercadopago_webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const handleViewPayload = (event: any) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    if (activeTab === "asaas") {
      refetchAsaas();
    } else {
      refetchMP();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Eventos de Webhook</CardTitle>
          <CardDescription>Monitoramento dos eventos recebidos dos gateways de pagamento</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="asaas" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="asaas">Asaas</TabsTrigger>
            <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
          </TabsList>
          
          <TabsContent value="asaas">
            {isLoadingAsaas ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <WebhookEventsList 
                events={asaasEvents || []} 
                onViewPayload={handleViewPayload} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="mercadopago">
            {isLoadingMP ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <WebhookEventsList 
                events={mpEvents || []} 
                onViewPayload={handleViewPayload}
                gatewayType="mercadopago"
              />
            )}
          </TabsContent>
        </Tabs>

        <PayloadDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          payload={selectedEvent?.payload}
        />
      </CardContent>
    </Card>
  );
}
