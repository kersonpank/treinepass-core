
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { AsaasSettings } from "@/types/system-settings";
import { useAsaasApiTest } from "@/hooks/useAsaasApiTest";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  sandbox_api_key: z.string().min(1, "Chave API Sandbox é obrigatória"),
  production_api_key: z.string().optional(),
  webhook_token: z.string().optional(),
});

interface AsaasSettingsFormProps {
  settings: AsaasSettings;
  onSubmit: (values: AsaasSettings) => Promise<any>;
  isLoading?: boolean;
}

export function AsaasSettingsForm({
  settings,
  onSubmit,
  isLoading = false,
}: AsaasSettingsFormProps) {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const { testApiKey } = useAsaasApiTest();

  const form = useForm<AsaasSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      environment: settings.environment,
      sandbox_api_key: settings.sandbox_api_key || "",
      production_api_key: settings.production_api_key || "",
      webhook_token: settings.webhook_token || "",
    },
  });

  const handleTestApiKey = async () => {
    try {
      setIsTesting(true);
      const formValues = form.getValues();
      
      // Escolher qual chave testar com base no ambiente selecionado
      const apiKey = formValues.environment === "production"
        ? formValues.production_api_key
        : formValues.sandbox_api_key;
        
      if (!apiKey) {
        toast({
          title: "Erro ao testar API",
          description: "Por favor, informe uma chave API válida para o ambiente selecionado.",
          variant: "destructive"
        });
        return;
      }
      
      const result = await testApiKey({
        apiKey,
        environment: formValues.environment
      });
      
      if (result.success) {
        toast({
          title: "Teste bem-sucedido",
          description: result.message || "Conexão estabelecida com sucesso!"
        });
      } else {
        toast({
          title: "Erro ao conectar",
          description: result.message || "Não foi possível conectar à API do Asaas.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao testar API:", error);
      toast({
        title: "Erro ao testar API",
        description: error.message || "Ocorreu um erro ao testar a conexão com a API.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFormSubmit = async (values: AsaasSettings) => {
    try {
      await onSubmit(values);
      toast({
        title: "Configurações salvas",
        description: "As configurações do Asaas foram atualizadas com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Asaas</CardTitle>
        <CardDescription>
          Configure a integração com a plataforma de pagamentos Asaas.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ambiente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Ambiente de desenvolvimento (sandbox) ou produção.
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
                  <FormLabel>Chave API (Sandbox)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="$aact_YourSandboxApiKey"
                      type="password"
                    />
                  </FormControl>
                  <FormDescription>
                    Chave de API do ambiente de testes Asaas. Formato: $aact_XXXXX.
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
                  <FormLabel>Chave API (Produção)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="$aact_YourProductionApiKey"
                      type="password"
                    />
                  </FormControl>
                  <FormDescription>
                    Chave de API do ambiente de produção Asaas. Formato: $aact_XXXXX.
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
                    <Input
                      {...field}
                      placeholder="Token para validação de webhooks"
                    />
                  </FormControl>
                  <FormDescription>
                    Token utilizado para validar notificações do Asaas via webhook.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTestApiKey} 
              disabled={isLoading || isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
