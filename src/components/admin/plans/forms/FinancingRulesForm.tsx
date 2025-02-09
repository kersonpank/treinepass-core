
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
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

export function FinancingRulesForm() {
  const form = useFormContext<PlanFormValues>();
  const contributionType = form.watch("financing_rules.contribution_type");
  const monthlyTotal = Number(form.watch("monthly_cost")) || 0;

  const handleCompanyContributionChange = (value: number) => {
    form.setValue("financing_rules.company_contribution", value);
    if (contributionType === "fixed") {
      // Calcula a contribuição do funcionário como o restante
      const employeeContribution = Math.max(0, monthlyTotal - value);
      form.setValue("financing_rules.employee_contribution", employeeContribution);
    } else {
      // Ajusta a contribuição do funcionário para completar 100%
      const employeeContribution = Math.max(0, 100 - value);
      form.setValue("financing_rules.employee_contribution", employeeContribution);
    }
  };

  const handleEmployeeContributionChange = (value: number) => {
    form.setValue("financing_rules.employee_contribution", value);
    if (contributionType === "fixed") {
      // Calcula a contribuição da empresa como o restante
      const companyContribution = Math.max(0, monthlyTotal - value);
      form.setValue("financing_rules.company_contribution", companyContribution);
    } else {
      // Ajusta a contribuição da empresa para completar 100%
      const companyContribution = Math.max(0, 100 - value);
      form.setValue("financing_rules.company_contribution", companyContribution);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Regras de Cofinanciamento</CardTitle>
          <CardDescription>
            Define como o valor do plano será dividido entre empresa e funcionário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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
                      max={contributionType === "percentage" ? "100" : monthlyTotal}
                      {...field}
                      onChange={(e) => handleCompanyContributionChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {contributionType === "fixed" && (
                    <FormDescription>
                      Valor máximo: R$ {monthlyTotal.toFixed(2)}
                    </FormDescription>
                  )}
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
                      max={contributionType === "percentage" ? "100" : monthlyTotal}
                      {...field}
                      onChange={(e) => handleEmployeeContributionChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {contributionType === "fixed" && (
                    <FormDescription>
                      Valor máximo: R$ {monthlyTotal.toFixed(2)}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {contributionType === "fixed" && (
            <div className="text-sm text-muted-foreground">
              Total: R$ {monthlyTotal.toFixed(2)}
            </div>
          )}
          {contributionType === "percentage" && (
            <div className="text-sm text-muted-foreground">
              Total: {form.watch("financing_rules.company_contribution") + form.watch("financing_rules.employee_contribution")}%
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
