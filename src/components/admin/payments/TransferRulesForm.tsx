
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
import type { TransferRule } from "./types/payment";

interface TransferRulesFormProps {
  rule?: TransferRule | null;
  onSuccess?: () => void;
}

export function TransferRulesForm({ rule, onSuccess }: TransferRulesFormProps) {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      academia_id: rule?.academia_id || "",
      minimum_transfer_amount: rule?.minimum_transfer_amount || 20,
      transfer_day: rule?.transfer_day || 5,
      automatic_transfer: rule?.automatic_transfer || true,
    },
  });

  const { data: academias } = useQuery({
    queryKey: ["academias-for-transfer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select("id, nome")
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (values: any) => {
    try {
      if (rule?.id) {
        const { error } = await supabase
          .from("transfer_rules")
          .update(values)
          .eq("id", rule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transfer_rules")
          .insert([values]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Regras de repasse salvas com sucesso.",
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
          name="academia_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academia</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma academia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {academias?.map((academia) => (
                    <SelectItem key={academia.id} value={academia.id}>
                      {academia.nome}
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
          name="minimum_transfer_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Mínimo para Repasse</FormLabel>
              <FormControl>
                <Input type="number" min={0} step={0.01} {...field} />
              </FormControl>
              <FormDescription>
                Valor mínimo acumulado para realizar o repasse
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transfer_day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dia do Repasse</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={28} {...field} />
              </FormControl>
              <FormDescription>
                Dia do mês para realizar o repasse (1-28)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="automatic_transfer"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Repasse Automático</FormLabel>
                <FormDescription>
                  Realizar repasses automaticamente no dia definido
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

        <Button type="submit">
          {rule ? "Atualizar" : "Criar"} Regra
        </Button>
      </form>
    </Form>
  );
}
