import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { PlanFormValues } from "../types/plan";
import { MultipleSelect, TTag } from "@/components/ui/multiple-select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlanDetailsFormProps {
  form: UseFormReturn<PlanFormValues>;
}

export function PlanDetailsForm({ form }: PlanDetailsFormProps) {
  const showSubsidyFields = form.watch("plan_type") === "corporate_subsidized";
  const showCorporateFields = form.watch("plan_type") === "corporate" || form.watch("plan_type") === "corporate_subsidized";

  // Query to fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_categorias")
        .select("*")
        .eq("active", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const categoryTags: TTag[] = categories?.map(cat => ({
    key: cat.id,
    name: cat.nome
  })) || [];

  const selectedCategories = form.watch("category_ids") || [];
  const defaultTags = categoryTags.filter(tag => selectedCategories.includes(tag.key));

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Plano</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="monthly_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo Total</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Periodicidade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a periodicidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="plan_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo do Plano</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo do plano" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="corporate">Corporativo</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="corporate_subsidized">Corporativo Subsidiado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {showCorporateFields && (
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
      )}

      {showSubsidyFields && (
        <>
          <FormField
            control={form.control}
            name="subsidy_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Subsídio</FormLabel>
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
                  Valor que será subsidiado pela empresa
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </>
      )}

      <FormField
        control={form.control}
        name="category_ids"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categorias</FormLabel>
            <FormControl>
              <MultipleSelect
                tags={categoryTags}
                onChange={(selected) => field.onChange(selected.map(s => s.key))}
                defaultValue={defaultTags}
              />
            </FormControl>
            <FormDescription>
              As categorias definem quais academias este plano terá acesso
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="base_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço Base</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="platform_fee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Taxa da Plataforma (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="renewal_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Renovação</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de renovação" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="automatic">Automática</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="payment_rules.continue_without_use"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Continuar Cobrança sem Uso</FormLabel>
              <FormDescription>
                Continuar cobrando mesmo se o plano não for utilizado
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
        name="status"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Status</FormLabel>
              <FormDescription>
                Ative ou desative a disponibilidade do plano
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value === "active"}
                onCheckedChange={(checked) =>
                  field.onChange(checked ? "active" : "inactive")
                }
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
