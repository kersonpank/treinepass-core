
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AsaasSettingsForm } from "./AsaasSettingsForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AsaasSettings } from "@/types/system-settings";

export function SystemSettings() {
  const { toast } = useToast();
  const [asaasSettings, setAsaasSettings] = useState<AsaasSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load settings on first render
  useEffect(() => {
    loadSettings();
  }, []);
  
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
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "asaas_settings",
          value: values
        });
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setAsaasSettings(values);
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
