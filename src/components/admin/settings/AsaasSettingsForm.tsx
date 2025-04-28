
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Loader2, Info, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AsaasSettings } from "@/types/system-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validateAsaasApiKey } from "@/utils/asaas-helpers";

interface AsaasSettingsFormProps {
  settings: AsaasSettings;
  onSubmit: (values: AsaasSettings) => Promise<void>;
  isLoading?: boolean;
}

export function AsaasSettingsForm({ 
  settings, 
  onSubmit,
  isLoading = false
}: AsaasSettingsFormProps) {
  const { toast } = useToast();
  const [showTestResult, setShowTestResult] = useState<{success: boolean; message: string} | null>(null);
  
  const form = useForm<AsaasSettings>({
    defaultValues: {
      sandbox_api_key: "",
      production_api_key: "",
      webhook_token: "",
      environment: "sandbox"
    }
  });

  useEffect(() => {
    if (settings) {
      // Type assertion to handle potential unknown type
      const typedSettings = settings as AsaasSettings;
      
      form.reset({
        sandbox_api_key: typedSettings.sandbox_api_key || "",
        production_api_key: typedSettings.production_api_key || "",
        webhook_token: typedSettings.webhook_token || "",
        environment: typedSettings.environment || "sandbox"
      });
    }
  }, [settings, form]);

  const handleSubmit = async (values: AsaasSettings) => {
    try {
      // Validate API key format based on selected environment
      const keyToValidate = values.environment === 'sandbox' 
        ? values.sandbox_api_key 
        : values.production_api_key;
        
      if (!validateAsaasApiKey(keyToValidate)) {
        toast({
          variant: "destructive",
          title: "Formato de API key inválido",
          description: "Verifique se você está utilizando o formato correto da chave API do Asaas.",
        });
        return;
      }

      await onSubmit(values);
      toast({
        title: "Configurações salvas",
        description: "As configurações do Asaas foram atualizadas com sucesso.",
      });
      setShowTestResult(null); // Reset test result after successful save
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configurações do Asaas</CardTitle>
        <CardDescription>Configure suas credenciais para integração com o Asaas</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Formato da API Key</AlertTitle>
          <AlertDescription>
            Cole a chave API exatamente como fornecida pelo Asaas.<br/>
            Exemplo: <code className="bg-amber-100 px-2 py-1 rounded text-xs">{`$aact_YourTokenHere::$aach_MoreTokenData`}</code>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ambiente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
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
                    <Input 
                      placeholder="Chave API do ambiente de testes" 
                      {...field} 
                      type="password"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Acesse o <a href="https://sandbox.asaas.com/api-doc" target="_blank" rel="noreferrer" className="text-primary hover:underline">Painel Sandbox do Asaas</a> para obter sua chave de testes.
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
                    <Input 
                      placeholder="Chave API do ambiente de produção" 
                      {...field} 
                      type="password"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Acesse o <a href="https://www.asaas.com/api-doc" target="_blank" rel="noreferrer" className="text-primary hover:underline">Painel de Produção do Asaas</a> para obter sua chave de produção.
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
                      placeholder="Token de segurança do webhook" 
                      {...field}
                      type="password"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showTestResult && (
              <Alert className={showTestResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}>
                <Info className="h-4 w-4" />
                <AlertTitle>{showTestResult.success ? "Teste bem sucedido!" : "Falha no teste"}</AlertTitle>
                <AlertDescription>{showTestResult.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar configurações"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
