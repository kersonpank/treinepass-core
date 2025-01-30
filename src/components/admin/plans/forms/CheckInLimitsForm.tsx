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

const checkInLimitsSchema = z.object({
  daily_limit: z.number().min(0).optional(),
  weekly_limit: z.number().min(0).optional(),
  monthly_limit: z.number().min(0).optional(),
});

type CheckInLimitsFormValues = z.infer<typeof checkInLimitsSchema>;

interface CheckInLimitsFormProps {
  planId: string;
  onSuccess?: () => void;
}

export function CheckInLimitsForm({ planId, onSuccess }: CheckInLimitsFormProps) {
  const { toast } = useToast();
  const form = useForm<CheckInLimitsFormValues>({
    resolver: zodResolver(checkInLimitsSchema),
    defaultValues: {
      daily_limit: 0,
      weekly_limit: 0,
      monthly_limit: 0,
    },
  });

  const onSubmit = async (data: CheckInLimitsFormValues) => {
    try {
      const { error } = await supabase
        .from("plan_check_in_limits")
        .upsert({
          plan_id: planId,
          ...data,
        });

      if (error) throw error;

      toast({
        title: "Limites atualizados",
        description: "Os limites de check-in foram atualizados com sucesso.",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error updating check-in limits:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar limites",
        description: "Não foi possível atualizar os limites de check-in.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="daily_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite Diário</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
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
          name="weekly_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite Semanal</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
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
          name="monthly_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite Mensal</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Salvar Limites</Button>
      </form>
    </Form>
  );
}