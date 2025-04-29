
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { AsaasSettings, extractAsaasApiToken } from "@/types/system-settings";
import { supabase } from "@/integrations/supabase/client";

// Schema for form validation
const asaasSettingsSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  sandbox_api_key: z.string().min(1, "API Key de Sandbox é obrigatória"),
  production_api_key: z.string().optional(),
  webhook_token: z.string().optional(),
});

type AsaasSettingsFormValues = z.infer<typeof asaasSettingsSchema>;

interface AsaasSettingsFormProps {
  settings: AsaasSettings;
  onSubmit: (values: AsaasSettings) => Promise<void>;
  isLoading?: boolean;
}

export function AsaasSettingsForm({
  settings,
  onSubmit,
  isLoading = false,
}: AsaasSettingsFormProps) {
  const { toast } = useToast();
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Initialize form with settings
  const form = useForm<AsaasSettingsFormValues>({
    resolver: zodResolver(asaasSettingsSchema),
    defaultValues: {
      environment: settings.environment,
      sandbox_api_key: settings.sandbox_api_key || "",
      production_api_key: settings.production_api_key || "",
      webhook_token: settings.webhook_token || "",
    },
  });

  const handleSubmit = async (values: AsaasSettingsFormValues) => {
    try {
      // Normalize the form values to match the AsaasSettings type
      const submissionValues: AsaasSettings = {
        environment: values.environment,
        sandbox_api_key: values.sandbox_api_key,
        production_api_key: values.production_api_key || "",
        webhook_token: values.webhook_token || "",
      };
      
      await onSubmit(submissionValues);
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do Asaas foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving Asaas settings:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do Asaas.",
      });
    }
  };

  const testApiConnection = async () => {
    try {
      setIsTestingApi(true);
      const environment = form.getValues("environment");
      const apiKey = environment === "sandbox" 
        ? form.getValues("sandbox_api_key") 
        : form.getValues("production_api_key");
      
      if (!apiKey) {
        throw new Error("API Key não informada");
      }
      
      const baseUrl = environment === "production"
        ? "https://api.asaas.com/v3"
        : "https://api-sandbox.asaas.com/v3";

      const extractedApiKey = extractAsaasApiToken(apiKey);
      
      // Test the API connection
      const response = await fetch(`${baseUrl}/finance/balance`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access_token": extractedApiKey || "",
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.description || "Erro de conexão com a API");
      }
      
      toast({
        title: "Conexão bem-sucedida",
        description: "A conexão com a API do Asaas foi estabelecida com sucesso.",
      });
    } catch (error: any) {
      console.error("API connection test error:", error);
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: error.message || "Não foi possível conectar à API do Asaas.",
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="environment"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Ambiente</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="sandbox" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Sandbox (Testes)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="production" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Produção (Ao vivo)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Selecione o ambiente para processar pagamentos.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sandbox_api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key (Sandbox)</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="$aact_..." />
              </FormControl>
              <FormDescription>
                Chave de API para o ambiente de testes do Asaas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="production_api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key (Produção)</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="$aact_..." />
              </FormControl>
              <FormDescription>
                Chave de API para o ambiente de produção do Asaas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="webhook_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token do Webhook</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="Token de segurança para webhooks" />
              </FormControl>
              <FormDescription>
                Token para validar as notificações recebidas via webhook.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={testApiConnection}
            disabled={isTestingApi}
          >
            {isTestingApi ? "Testando..." : "Testar Conexão"}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
