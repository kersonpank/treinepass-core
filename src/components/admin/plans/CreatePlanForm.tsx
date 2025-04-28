
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

interface CreatePlanFormProps {
  onSuccess?: () => void;
}

const planSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  description: z.string().optional(),
  monthly_cost: z.coerce.number().min(0, "O valor deve ser maior que zero"),
  status: z.enum(["active", "inactive", "draft"]).default("draft"),
  plan_type: z.enum(["individual", "corporate", "corporate_subsidized"]),
  period_type: z.enum(["monthly", "yearly"]).default("monthly"),
  
  // These fields should be numbers, not strings
  annual_discount: z.coerce.number().min(0).max(100).default(0),
  corporate_discount: z.coerce.number().min(0).max(100).default(0),
  
  features: z.array(z.string()).optional().default([]),
  
  // Add missing fields according to Plan interface
  payment_methods: z.array(z.string()).default(["credit_card", "pix", "boleto"]),
  
  // Fields with default values
  auto_renewal: z.boolean().default(true),
  check_in_rules: z.any().default({
    daily_limit: null,
    weekly_limit: null, 
    monthly_limit: null,
    extra_checkin_cost: null,
    allow_extra_checkins: false
  }),
  cancellation_rules: z.any().default({
    user_can_cancel: true,
    company_can_cancel: true,
    notice_period_days: 30
  }),
  rules: z.any().default({}),
  payment_rules: z.any().default({})
});

type PlanFormData = z.infer<typeof planSchema>;

export function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      monthly_cost: 0,
      status: "draft",
      plan_type: "individual",
      period_type: "monthly",
      annual_discount: 0,
      corporate_discount: 0,
      features: [],
      // Include other default values
      payment_methods: ["credit_card", "pix", "boleto"],
      auto_renewal: true,
      check_in_rules: {
        daily_limit: null,
        weekly_limit: null,
        monthly_limit: null,
        extra_checkin_cost: null,
        allow_extra_checkins: false
      },
      cancellation_rules: {
        user_can_cancel: true,
        company_can_cancel: true,
        notice_period_days: 30
      },
      rules: {},
      payment_rules: {}
    },
  });

  const onSubmit = async (data: PlanFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Form data:", data);
      // Here you would normally send the data to your API
      
      // If successful, call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="basic">Informações básicas</TabsTrigger>
            <TabsTrigger value="pricing">Preços e descontos</TabsTrigger>
            <TabsTrigger value="rules">Regras e limitações</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="py-4">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do plano</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do plano" {...field} />
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
                      <Textarea placeholder="Descrição do plano" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="draft">Rascunho</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plan_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de plano</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="corporate">Corporativo</SelectItem>
                          <SelectItem value="corporate_subsidized">
                            Corporativo Subsidiado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="pricing" className="py-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="monthly_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor mensal (R$)</FormLabel>
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
                  name="annual_discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto anual (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          {...field}
                          value={field.value?.toString()}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="corporate_discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto corporativo (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          {...field}
                          value={field.value?.toString()}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="period_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de período</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          <TabsContent value="rules" className="py-4">
            <div className="grid grid-cols-1 gap-6">
              <p className="text-muted-foreground">
                Configure as regras e limitações do plano.
              </p>
              {/* Rules content would go here */}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar plano"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
