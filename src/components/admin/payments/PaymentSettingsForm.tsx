
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { PaymentSettings } from "./types/payment";

interface PaymentSettingsFormProps {
  setting?: PaymentSettings | null;
  onSuccess?: () => void;
}

export function PaymentSettingsForm({ setting, onSuccess }: PaymentSettingsFormProps) {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      plan_id: setting?.plan_id || "",
      billing_type: setting?.billing_type || "BOLETO",
      due_day: setting?.due_day || 5,
      automatic_retry: setting?.automatic_retry || true,
      max_retry_attempts: setting?.max_retry_attempts || 3,
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["plans-for-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("id, name")
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (values: any) => {
    try {
      if (setting?.id) {
        const { error } = await supabase
          .from("plan_payment_settings")
          .update(values)
          .eq("id", setting.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("plan_payment_settings")
          .insert([values]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações de pagamento salvas com sucesso.",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="plan_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billing_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Cobrança</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dia de Vencimento</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={28} {...field} />
              </FormControl>
              <FormDescription>
                Dia do mês para vencimento das cobranças (1-28)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="automatic_retry"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Tentativa Automática</FormLabel>
                <FormDescription>
                  Tentar novamente automaticamente em caso de falha
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_retry_attempts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Máximo de Tentativas</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={10} {...field} />
              </FormControl>
              <FormDescription>
                Número máximo de tentativas de cobrança (1-10)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {setting ? "Atualizar" : "Criar"} Configuração
        </Button>
      </form>
    </Form>
  );
}
