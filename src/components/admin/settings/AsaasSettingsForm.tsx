
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { AsaasSettings, extractAsaasApiToken } from "@/types/system-settings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AsaasSettingsFormProps {
  settings: AsaasSettings;
  onSubmit: (values: AsaasSettings) => Promise<void>;
  isLoading?: boolean;
}

// Define schema matching the AsaasSettings type
const asaasSettingsSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  sandbox_api_key: z.string().min(1, "API Key de sandbox é obrigatória"),
  production_api_key: z.string().optional(),
  webhook_token: z.string().optional()
});

export function AsaasSettingsForm({ settings, onSubmit, isLoading = false }: AsaasSettingsFormProps) {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const form = useForm<AsaasSettings>({
    resolver: zodResolver(asaasSettingsSchema) as any,
    defaultValues: {
      environment: settings.environment,
      sandbox_api_key: settings.sandbox_api_key || "",
      production_api_key: settings.production_api_key || "",
      webhook_token: settings.webhook_token || ""
    }
  });

  const handleSubmit = async (values: AsaasSettings) => {
    try {
      await onSubmit(values);
    } catch (error) {
      // Error already handled in onSubmit
      console.error("Error submitting form:", error);
    }
  };

  // Function to test connection with Asaas
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const values = form.getValues();
      const apiKey = values.environment === "production" ? values.production_api_key : values.sandbox_api_key;
      
      if (!apiKey) {
        throw new Error("API Key não configurada para o ambiente selecionado");
      }
      
      // Call edge function to test connection
      const { data, error } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "testApiKey",
            data: {
              apiKey,
              environment: values.environment
            }
          }
        }
      );
      
      if (error) throw error;
      
      if (data && data.success) {
        setTestResult({ success: true, message: data.message || "Conexão com o Asaas estabelecida com sucesso!" });
      } else {
        throw new Error(data?.message || "Resposta inválida do Asaas");
      }
    } catch (error: any) {
      console.error("Erro ao testar conexão:", error);
      setTestResult({ 
        success: false, 
        message: error.message || "Não foi possível conectar ao Asaas" 
      });
      
      toast({
        variant: "destructive",
        title: "Erro ao testar conexão",
        description: error.message || "Não foi possível conectar ao Asaas"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da API do Asaas</CardTitle>
        <CardDescription>
          Configure as credenciais da API do Asaas para processar pagamentos.
          <a 
            href="https://docs.asaas.com/reference/autentica%C3%A7%C3%A3o" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline ml-1"
          >
            Ver documentação
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ambiente</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="sandbox" id="sandbox" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="sandbox">
                          Sandbox (Testes)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="production" id="production" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="production">
                          Produção
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Selecione o ambiente onde a integração será executada.
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
                  <FormLabel>API Key de Sandbox</FormLabel>
                  <FormControl>
                    <Input placeholder="$aact_..." {...field} type="password" />
                  </FormControl>
                  <FormDescription>
                    API Key para ambiente de testes. Formato: $aact_YourKey
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
                  <FormLabel>API Key de Produção</FormLabel>
                  <FormControl>
                    <Input placeholder="$aact_..." {...field} type="password" />
                  </FormControl>
                  <FormDescription>
                    API Key para ambiente de produção. Formato: $aact_YourKey
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
                  <FormLabel>Token de Webhook</FormLabel>
                  <FormControl>
                    <Input placeholder="Token para validação de webhooks" {...field} />
                  </FormControl>
                  <FormDescription>
                    Token para validação de webhooks do Asaas (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {testResult && (
              <div className={`p-4 rounded-md flex items-center ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={testConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col bg-muted/50 text-sm text-muted-foreground">
        <p>
          As configurações do Asaas são essenciais para processar pagamentos na plataforma.
        </p>
        <p className="mt-2">
          Acesse o <a href="https://sandbox.asaas.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Sandbox do Asaas</a> ou o <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Asaas Produção</a> para obter suas chaves.
        </p>
      </CardFooter>
    </Card>
  );
}
