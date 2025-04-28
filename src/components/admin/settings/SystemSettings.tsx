
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
        // Ensure the value is properly typed
        let settings: AsaasSettings;
        
        if (typeof data.value === 'string') {
          try {
            settings = JSON.parse(data.value) as AsaasSettings;
          } catch (e) {
            console.error("Error parsing settings JSON:", e);
            throw new Error("Invalid settings format");
          }
        } else {
          // The value is already an object, cast it to AsaasSettings
          settings = data.value as AsaasSettings;
        }
        
        setAsaasSettings(settings);
      } else {
        // Create default settings
        const defaultSettings: AsaasSettings = {
          environment: "sandbox",
          sandbox_api_key: "",
          production_api_key: "",
          webhook_token: ""
        };
        setAsaasSettings(defaultSettings);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save Asaas settings
  const saveAsaasSettings = async (values: AsaasSettings) => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .upsert({
          key: "asaas_settings",
          value: values
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setAsaasSettings(values);
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message
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
