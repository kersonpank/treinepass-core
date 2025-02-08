
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PlanFormValues } from "../types/plan";

export function FinancingRulesForm() {
  const form = useFormContext<PlanFormValues>();
  const planType = form.watch("plan_type");
  const financingType = form.watch("financing_rules.type");
  const contributionType = form.watch("financing_rules.contribution_type");

  if (planType === "individual") {
    return null;
  }

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="financing_rules.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Financiamento</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de financiamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="company_paid">Pago pela Empresa</SelectItem>
                <SelectItem value="employee_paid">Pago pelo Funcionário</SelectItem>
                <SelectItem value="co_financed">Cofinanciado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {financingType === "co_financed" && (
        <>
          <FormField
            control={form.control}
            name="financing_rules.contribution_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contribuição</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de contribuição" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                    <SelectItem value="percentage">Porcentagem</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Define como será calculada a contribuição de cada parte
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="financing_rules.company_contribution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Contribuição da Empresa ({contributionType === "percentage" ? "%" : "R$"})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={contributionType === "percentage" ? "1" : "0.01"}
                    min="0"
                    max={contributionType === "percentage" ? "100" : undefined}
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
            name="financing_rules.employee_contribution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Contribuição do Funcionário ({contributionType === "percentage" ? "%" : "R$"})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={contributionType === "percentage" ? "1" : "0.01"}
                    min="0"
                    max={contributionType === "percentage" ? "100" : undefined}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

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
    </div>
  );
}
