import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { PlanFormValues } from "../types/plan";

interface CancellationRulesFormProps {
  form: UseFormReturn<PlanFormValues>;
}

export function CancellationRulesForm({ form }: CancellationRulesFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="cancellation_rules.company_can_cancel"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Empresa pode cancelar</FormLabel>
              <FormDescription>
                Permitir que a empresa cancele o plano
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
        name="cancellation_rules.user_can_cancel"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Usuário pode cancelar</FormLabel>
              <FormDescription>
                Permitir que o usuário cancele o plano
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
        name="cancellation_rules.notice_period_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Período de Aviso Prévio (dias)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Quantidade de dias necessários para aviso prévio de cancelamento
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}