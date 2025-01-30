import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { PlanFormValues } from "../types/plan";

interface CheckInRulesFormProps {
  form: UseFormReturn<PlanFormValues>;
}

export function CheckInRulesForm({ form }: CheckInRulesFormProps) {
  const allowExtraCheckins = form.watch("check_in_rules.allow_extra_checkins");

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="check_in_rules.daily_limit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Limite Diário de Check-ins</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                placeholder="Sem limite"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="check_in_rules.weekly_limit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Limite Semanal de Check-ins</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                placeholder="Sem limite"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="check_in_rules.monthly_limit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Limite Mensal de Check-ins</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                placeholder="Sem limite"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="check_in_rules.allow_extra_checkins"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Permitir Check-ins Extras</FormLabel>
              <FormDescription>
                Permitir check-ins além do limite mediante pagamento
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

      {allowExtraCheckins && (
        <FormField
          control={form.control}
          name="check_in_rules.extra_checkin_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo por Check-in Extra</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );
}