import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AsaasSettings } from '@/types/system-settings';

const asaasSettingsSchema = z.object({
  sandbox_api_key: z.string().min(1, 'Chave da API Sandbox é obrigatória'),
  production_api_key: z.string().min(1, 'Chave da API de Produção é obrigatória'),
  webhook_token: z.string().min(1, 'Token do Webhook é obrigatório'),
  environment: z.enum(['sandbox', 'production'], {
    required_error: 'Selecione o ambiente',
  }),
});

type AsaasSettingsFormData = z.infer<typeof asaasSettingsSchema>;

export function AsaasSettingsForm() {
  const { toast } = useToast();

  const form = useForm<AsaasSettingsFormData>({
    resolver: zodResolver(asaasSettingsSchema),
    defaultValues: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'asaas_settings')
        .single();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return {
          sandbox_api_key: '',
          production_api_key: '',
          webhook_token: '',
          environment: 'sandbox',
        };
      }

      return data?.value as AsaasSettings;
    },
  });

  const onSubmit = async (data: AsaasSettingsFormData) => {
    try {
      // Primeiro verifica se já existe
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', 'asaas_settings')
        .single();

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: existingSettings?.id, // Inclui o id se existir
          key: 'asaas_settings',
          value: data,
        }, {
          onConflict: 'key' // Especifica a coluna de conflito
        });

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Asaas foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Asaas</CardTitle>
        <CardDescription>
          Configure as chaves de API e token do webhook para integração com o Asaas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sandbox_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave da API Sandbox</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
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
                  <FormLabel>Chave da API de Produção</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
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
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ambiente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Salvar configurações</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 