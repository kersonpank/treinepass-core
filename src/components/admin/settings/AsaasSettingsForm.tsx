
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AsaasSettings } from "@/types/system-settings";

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
      await onSubmit(values);
      toast({
        title: "Configurações salvas",
        description: "As configurações do Asaas foram atualizadas com sucesso.",
      });
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
