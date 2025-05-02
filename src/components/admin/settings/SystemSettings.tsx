
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AsaasSettingsForm } from "./AsaasSettingsForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AsaasSettings, PaymentGatewaySettings, PaymentGatewayType, SystemSettingsRow } from "@/types/system-settings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function SystemSettings() {
  const [activeGateway, setActiveGateway] = useState<PaymentGatewayType>('asaas');
  const [isLoadingGateway, setIsLoadingGateway] = useState(true);

  const { toast } = useToast();
  const [asaasSettings, setAsaasSettings] = useState<AsaasSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load settings on first render
  useEffect(() => {
    loadSettings();
    loadActiveGateway();
  }, []);

  // Load active gateway from db
  const loadActiveGateway = async () => {
    setIsLoadingGateway(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'active_payment_gateway')
      .maybeSingle();
    if (!error && data?.value?.active_gateway) {
      setActiveGateway(data.value.active_gateway);
    }
    setIsLoadingGateway(false);
  };

  // Save active gateway to db
  const saveActiveGateway = async (gateway: PaymentGatewayType) => {
    setIsLoadingGateway(true);
    const settingsRow: SystemSettingsRow = {
      key: 'active_payment_gateway',
      value: { active_gateway: gateway },
    };
    const { error } = await supabase
      .from('system_settings')
      .upsert(settingsRow);
    setIsLoadingGateway(false);
    if (!error) {
      setActiveGateway(gateway);
      toast({
        title: 'Gateway de pagamento atualizado',
        description: `Gateway ativo: ${gateway === 'asaas' ? 'Asaas' : 'MercadoPago'}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar gateway',
        description: error.message,
      });
    }
  };

  
  // Load settings from database
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "asaas_settings")
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (data?.value) {
        // Cast to AsaasSettings type with proper type safety
        const settings = data.value as unknown;
        const typedSettings = settings as AsaasSettings;
        
        // Ensure all required fields are present
        if (
          typeof typedSettings.environment === 'string' &&
          typeof typedSettings.sandbox_api_key === 'string' &&
          typeof typedSettings.production_api_key === 'string' &&
          typeof typedSettings.webhook_token === 'string'
        ) {
          setAsaasSettings(typedSettings);
        } else {
          // Create default settings if the data structure is incorrect
          createDefaultSettings();
        }
      } else {
        // Create default settings if there's no data
        createDefaultSettings();
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: error.message || "Não foi possível carregar as configurações."
      });
      // Fallback to default settings
      createDefaultSettings();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create default settings
  const createDefaultSettings = () => {
    const defaultSettings: AsaasSettings = {
      environment: "sandbox",
      sandbox_api_key: "",
      production_api_key: "",
      webhook_token: ""
    };
    setAsaasSettings(defaultSettings);
  };
  
  // Save Asaas settings
  const saveAsaasSettings = async (values: AsaasSettings) => {
    try {
      const settingsRow: SystemSettingsRow = {
        key: "asaas_settings",
        value: values
      };
      
      const { error } = await supabase
        .from("system_settings")
        .upsert(settingsRow);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setAsaasSettings(values);
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do Asaas foram salvas com sucesso."
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message || "Não foi possível salvar as configurações."
      });
      throw error;
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>
      
      <Tabs defaultValue="payment">
        <TabsList>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment" className="py-4">
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">Configurações de Pagamento</h2>

            <div>
              <Label className="block mb-2">Gateway de pagamento ativo</Label>
              <RadioGroup
                value={activeGateway}
                onValueChange={(v) => saveActiveGateway(v as PaymentGatewayType)}
                disabled={isLoadingGateway}
                className="flex flex-row gap-6 mb-4"
              >
                <RadioGroupItem value="asaas" id="asaas" />
                <Label htmlFor="asaas">Asaas</Label>
                <RadioGroupItem value="mercadopago" id="mercadopago" />
                <Label htmlFor="mercadopago">MercadoPago</Label>
              </RadioGroup>
            </div>

            {asaasSettings && (
              <AsaasSettingsForm 
                settings={asaasSettings} 
                onSubmit={saveAsaasSettings} 
                isLoading={isLoading}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="py-4">
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">Configurações de Notificações</h2>
            <p className="text-muted-foreground">
              Configure como e quando suas notificações são enviadas.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="integrations" className="py-4">
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">Configurações de Integrações</h2>
            <p className="text-muted-foreground">
              Configure integrações com outros serviços.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
