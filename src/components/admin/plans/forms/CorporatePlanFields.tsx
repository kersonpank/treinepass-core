import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PlanFormValues } from "../types/plan";

interface CorporatePlanFieldsProps {
  form: UseFormReturn<PlanFormValues>;
  isSubsidized: boolean;
}

export function CorporatePlanFields({ form, isSubsidized }: CorporatePlanFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="employee_limit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Limite de Funcionários</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                placeholder="Sem limite"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              />
            </FormControl>
            <FormDescription>
              Número máximo de funcionários que podem ser adicionados a este plano
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {isSubsidized && (
        <FormField
          control={form.control}
          name="user_final_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo Final para Usuário</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
              <FormDescription>
                Valor que o usuário pagará após o subsídio
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}