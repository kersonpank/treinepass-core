
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Schema for payment gateway settings
const paymentGatewaySchema = z.object({
  active_gateway: z.enum(["asaas", "mercadopago", "both"]),
  asaas: z.object({
    environment: z.enum(["sandbox", "production"]),
    sandbox_api_key: z.string().optional(),
    production_api_key: z.string().optional(),
    webhook_token: z.string().optional(),
  }),
  mercadopago: z.object({
    environment: z.enum(["sandbox", "production"]),
    sandbox_access_token: z.string().optional(),
    production_access_token: z.string().optional(),
    webhook_token: z.string().optional(),
  }),
});

type PaymentGatewaySettings = z.infer<typeof paymentGatewaySchema>;

export function SystemSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("payment");
  const [hasChanges, setHasChanges] = useState(false);

  // Form definition
  const form = useForm<PaymentGatewaySettings>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      active_gateway: "asaas",
      asaas: {
        environment: "sandbox",
        sandbox_api_key: "",
        production_api_key: "",
        webhook_token: "",
      },
      mercadopago: {
        environment: "sandbox",
        sandbox_access_token: "",
        production_access_token: "",
        webhook_token: "",
      },
    },
  });

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "payment_gateways")
          .single();

        if (error) {
          console.error("Error loading settings:", error);
          return;
        }

        if (data && data.value) {
          const settings = data.value as PaymentGatewaySettings;
          
          // Handle object or string value
          let parsedSettings;
          if (typeof data.value === 'string') {
            try {
              parsedSettings = JSON.parse(data.value);
            } catch (e) {
              console.error("Error parsing settings:", e);
              parsedSettings = {}; // Default empty object
            }
          } else {
            parsedSettings = data.value;
          }
          
          // Use safe access to avoid errors
          const formValues = {
            active_gateway: parsedSettings.active_gateway || "asaas",
            asaas: {
              environment: parsedSettings.asaas?.environment || "sandbox",
              sandbox_api_key: parsedSettings.asaas?.sandbox_api_key || "",
              production_api_key: parsedSettings.asaas?.production_api_key || "",
              webhook_token: parsedSettings.asaas?.webhook_token || "",
            },
            mercadopago: {
              environment: parsedSettings.mercadopago?.environment || "sandbox",
              sandbox_access_token: parsedSettings.mercadopago?.sandbox_access_token || "",
              production_access_token: parsedSettings.mercadopago?.production_access_token || "",
              webhook_token: parsedSettings.mercadopago?.webhook_token || "",
            },
          };
          
          form.reset(formValues);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Handle form submission
  const onSubmit = async (data: PaymentGatewaySettings) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "payment_gateways",
          value: data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de pagamento foram atualizadas com sucesso.",
      });
      setHasChanges(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações globais do sistema.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="payment">Gateways de Pagamento</TabsTrigger>
          <TabsTrigger value="system" disabled>Configurações Gerais</TabsTrigger>
          <TabsTrigger value="email" disabled>Email</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gateways de Pagamento</CardTitle>
                    <CardDescription>
                      Configure as integrações com gateways de pagamento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="active_gateway"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Gateway Ativo</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="asaas" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Asaas
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="mercadopago" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Mercado Pago
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="both" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Ambos
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Asaas Settings */}
                    {(form.watch("active_gateway") === "asaas" || form.watch("active_gateway") === "both") && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Configurações do Asaas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="asaas.environment"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Ambiente</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                  >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="sandbox" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Sandbox</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="production" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Produção</FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="asaas.sandbox_api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chave API (Sandbox)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="$aas_SANDBOX_..."
                                    {...field}
                                    type="password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="asaas.production_api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chave API (Produção)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="$aas_..."
                                    {...field}
                                    type="password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="asaas.webhook_token"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Token do Webhook</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Token para validação de webhooks"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Mercado Pago Settings */}
                    {(form.watch("active_gateway") === "mercadopago" || form.watch("active_gateway") === "both") && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Configurações do Mercado Pago</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="mercadopago.environment"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Ambiente</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                  >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="sandbox" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Sandbox</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="production" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Produção</FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="mercadopago.sandbox_access_token"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Access Token (Sandbox)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="TEST-0000000000000000-000000-00000000000000000000000000000000-000000000"
                                    {...field}
                                    type="password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="mercadopago.production_access_token"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Access Token (Produção)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000"
                                    {...field}
                                    type="password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="mercadopago.webhook_token"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Token do Webhook</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Token para validação de webhooks"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !hasChanges}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
