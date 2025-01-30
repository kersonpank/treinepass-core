import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, CreditCard, Calendar, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const planFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  monthly_cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Custo mensal deve ser um número maior que 0",
  }),
  plan_type: z.enum(["corporate", "individual", "corporate_subsidized"]),
  period_type: z.enum(["monthly", "quarterly", "semiannual", "annual"]),
  status: z.enum(["active", "inactive"]),
  category_id: z.string().uuid().optional(),
  payment_methods: z.array(z.enum(["credit_card", "pix", "boleto"])).default(["credit_card"]),
  check_in_rules: z.object({
    daily_limit: z.number().nullable(),
    weekly_limit: z.number().nullable(),
    monthly_limit: z.number().nullable(),
    allow_extra_checkins: z.boolean(),
    extra_checkin_cost: z.number().nullable(),
  }).default({
    daily_limit: null,
    weekly_limit: null,
    monthly_limit: null,
    allow_extra_checkins: false,
    extra_checkin_cost: null,
  }),
  auto_renewal: z.boolean().default(true),
  cancellation_rules: z.object({
    company_can_cancel: z.boolean(),
    user_can_cancel: z.boolean(),
    notice_period_days: z.number(),
  }).default({
    company_can_cancel: true,
    user_can_cancel: true,
    notice_period_days: 30,
  }),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

const defaultValues: Partial<PlanFormValues> = {
  name: "",
  description: "",
  monthly_cost: "",
  plan_type: "corporate",
  period_type: "monthly",
  status: "active",
  payment_methods: ["credit_card"],
  auto_renewal: true,
  check_in_rules: {
    daily_limit: null,
    weekly_limit: null,
    monthly_limit: null,
    allow_extra_checkins: false,
    extra_checkin_cost: null,
  },
  cancellation_rules: {
    company_can_cancel: true,
    user_can_cancel: true,
    notice_period_days: 30,
  },
};

interface CreatePlanFormProps {
  onSuccess?: () => void;
}

export function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      // Primeiro verifica se o usuário é admin
      const { data: userTypes, error: userTypesError } = await supabase
        .from("user_types")
        .select("type")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("type", "admin")
        .maybeSingle();

      if (userTypesError) throw userTypesError;

      // Se não for admin, tenta buscar o perfil da empresa
      let businessId = null;
      if (!userTypes) {
        const { data: businessProfile, error: businessError } = await supabase
          .from("business_profiles")
          .select("id")
          .maybeSingle();

        if (businessError) throw businessError;
        if (!businessProfile) {
          throw new Error("Perfil da empresa não encontrado");
        }
        businessId = businessProfile.id;
      }

      const { error } = await supabase.from("benefit_plans").insert({
        name: data.name,
        description: data.description,
        monthly_cost: Number(data.monthly_cost),
        plan_type: data.plan_type,
        period_type: data.period_type,
        status: data.status,
        category_id: data.category_id,
        payment_methods: data.payment_methods,
        check_in_rules: data.check_in_rules,
        auto_renewal: data.auto_renewal,
        cancellation_rules: data.cancellation_rules,
        rules: {},
      });

      if (error) throw error;

      toast({
        title: "Plano criado com sucesso!",
        description: "O novo plano foi adicionado ao sistema.",
      });

      queryClient.invalidateQueries({ queryKey: ["plans"] });
      form.reset(defaultValues);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar plano",
        description: "Não foi possível criar o plano. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Plano</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Plano Empresarial Premium" {...field} />
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
                    <Textarea
                      placeholder="Descreva os benefícios e características do plano"
                      {...field}
                    />
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
                    <FormLabel>Custo Mensal (R$)</FormLabel>
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
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Categories will be loaded dynamically */}
                        <SelectItem value="category1">Categoria 1</SelectItem>
                        <SelectItem value="category2">Categoria 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
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
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
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

                {form.watch("check_in_rules.allow_extra_checkins") && (
                  <FormField
                    control={form.control}
                    name="check_in_rules.extra_checkin_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo por Check-in Extra (R$)</FormLabel>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="payment_methods"
                  render={() => (
                    <FormItem>
                      <FormLabel>Métodos de Pagamento</FormLabel>
                      <div className="grid grid-cols-3 gap-4">
                        {["credit_card", "pix", "boleto"].map((method) => (
                          <FormField
                            key={method}
                            control={form.control}
                            name="payment_methods"
                            render={({ field }) => (
                              <FormItem
                                key={method}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(method as any)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      const updated = checked
                                        ? [...current, method]
                                        : current.filter((value) => value !== method);
                                      field.onChange(updated);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {method === "credit_card"
                                    ? "Cartão de Crédito"
                                    : method === "pix"
                                    ? "PIX"
                                    : "Boleto"}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auto_renewal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Renovação Automática</FormLabel>
                        <FormDescription>
                          Renovar automaticamente o plano ao final do período
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Plano
        </Button>
      </form>
    </Form>
  );
}