
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["system-settings", "asaas_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "asaas_config")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const toggleEnvironment = async () => {
    try {
      setIsSaving(true);
      const newEnvironment = settings?.value.environment === "sandbox" ? "production" : "sandbox";
      
      const { error } = await supabase
        .from("system_settings")
        .update({
          value: {
            ...settings?.value,
            environment: newEnvironment,
          },
        })
        .eq("key", "asaas_config");

      if (error) throw error;

      await refetch();
      toast.success(`Ambiente alterado para ${newEnvironment}`);
    } catch (error) {
      console.error("Erro ao alterar ambiente:", error);
      toast.error("Erro ao alterar ambiente");
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
                {settings?.value.environment === "sandbox" 
                  ? "Usando ambiente de testes (sandbox)"
                  : "Usando ambiente de produção"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings?.value.environment === "production"}
                onCheckedChange={toggleEnvironment}
                disabled={isSaving}
              />
              <span className="text-sm font-medium">
                {settings?.value.environment === "sandbox" ? "Sandbox" : "Produção"}
              </span>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              <strong>URL da API:</strong>{" "}
              {settings?.value.environment === "sandbox" 
                ? "https://sandbox.asaas.com/api/v3"
                : "https://api.asaas.com/api/v3"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
