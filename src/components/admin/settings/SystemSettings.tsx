
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AsaasSettings {
  environment: string;
  sandbox_api_key?: string;
  production_api_key?: string;
}

export function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [sandboxKey, setSandboxKey] = useState("");
  const [productionKey, setProductionKey] = useState("");

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["system-settings", "asaas_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "asaas_settings")
        .single();

      if (error) throw error;

      // Parse value if it's a string
      let settingsValue: AsaasSettings;
      if (typeof data?.value === 'string') {
        try {
          settingsValue = JSON.parse(data.value);
        } catch (e) {
          console.error("Error parsing settings:", e);
          settingsValue = { environment: 'sandbox' };
        }
      } else {
        settingsValue = data?.value as AsaasSettings || { environment: 'sandbox' };
      }

      // Atualizar os estados com as chaves existentes
      if (settingsValue) {
        setSandboxKey(settingsValue.sandbox_api_key || "");
        setProductionKey(settingsValue.production_api_key || "");
      }
      
      return {
        ...data,
        parsedValue: settingsValue
      };
    },
  });

  const toggleEnvironment = async () => {
    if (!settings?.parsedValue) return;
    
    try {
      setIsSaving(true);
      const newEnvironment = settings.parsedValue.environment === "sandbox" ? "production" : "sandbox";
      
      const { error } = await supabase
        .from("system_settings")
        .update({
          value: {
            ...settings.parsedValue,
            environment: newEnvironment,
          },
        })
        .eq("key", "asaas_settings");

      if (error) throw error;

      await refetch();
      toast.success(`Ambiente alterado para ${newEnvironment}`);
    } catch (error: any) {
      console.error("Erro ao alterar ambiente:", error);
      toast.error("Erro ao alterar ambiente");
    } finally {
      setIsSaving(false);
    }
  };

  const saveApiKeys = async () => {
    if (!settings?.parsedValue) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from("system_settings")
        .update({
          value: {
            ...settings.parsedValue,
            sandbox_api_key: sandboxKey,
            production_api_key: productionKey,
          },
        })
        .eq("key", "asaas_settings");

      if (error) throw error;

      await refetch();
      toast.success("Chaves API atualizadas com sucesso");
    } catch (error: any) {
      console.error("Erro ao salvar chaves API:", error);
      toast.error("Erro ao salvar chaves API");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configurações de Pagamento</h3>
          
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <h4 className="text-base font-medium">Ambiente Asaas</h4>
              <p className="text-sm text-muted-foreground">
                {settings?.parsedValue?.environment === "sandbox" 
                  ? "Usando ambiente de testes (sandbox)"
                  : "Usando ambiente de produção"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings?.parsedValue?.environment === "production"}
                onCheckedChange={toggleEnvironment}
                disabled={isSaving}
              />
              <span className="text-sm font-medium">
                {settings?.parsedValue?.environment === "sandbox" ? "Sandbox" : "Produção"}
              </span>
            </div>
          </div>

          {/* Configuração das chaves API */}
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="text-base font-medium">Chaves API</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chave API Sandbox</label>
                <Input
                  type="password"
                  value={sandboxKey}
                  onChange={(e) => setSandboxKey(e.target.value)}
                  placeholder="Insira a chave API do ambiente sandbox"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chave API Produção</label>
                <Input
                  type="password"
                  value={productionKey}
                  onChange={(e) => setProductionKey(e.target.value)}
                  placeholder="Insira a chave API do ambiente de produção"
                />
              </div>

              <Button 
                onClick={saveApiKeys}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Chaves API"
                )}
              </Button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              <strong>URL da API:</strong>{" "}
              {settings?.parsedValue?.environment === "sandbox" 
                ? "https://sandbox.asaas.com/api/v3"
                : "https://api.asaas.com/api/v3"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
