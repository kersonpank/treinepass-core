import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const volumeDiscountSchema = z.object({
  min_employees: z.number().min(1, "Mínimo deve ser maior que 0"),
  max_employees: z.number().optional(),
  discount_percentage: z.number().min(0).max(100),
});

type VolumeDiscountFormValues = z.infer<typeof volumeDiscountSchema>;

interface VolumeDiscountsFormProps {
  planId: string;
  onSuccess?: () => void;
}

export function VolumeDiscountsForm({ planId, onSuccess }: VolumeDiscountsFormProps) {
  const { toast } = useToast();
  const form = useForm<VolumeDiscountFormValues>({
    resolver: zodResolver(volumeDiscountSchema),
    defaultValues: {
      min_employees: 1,
      discount_percentage: 0,
    },
  });

  const onSubmit = async (data: VolumeDiscountFormValues) => {
    try {
      const { error } = await supabase
        .from("plan_volume_discounts")
        .insert({
          plan_id: planId,
          ...data,
        });

      if (error) throw error;

      toast({
        title: "Desconto adicionado",
        description: "O desconto por volume foi adicionado com sucesso.",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error adding volume discount:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar desconto",
        description: "Não foi possível adicionar o desconto por volume.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="min_employees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mínimo de Funcionários</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_employees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Máximo de Funcionários (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={form.watch("min_employees")}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discount_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentual de Desconto (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Adicionar Desconto</Button>
      </form>
    </Form>
  );
}