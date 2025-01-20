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
import { Loader2 } from "lucide-react";

const planFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  monthly_cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Custo mensal deve ser um número maior que 0",
  }),
  plan_type: z.enum(["corporate", "individual"]),
  period_type: z.enum(["monthly", "quarterly", "semiannual", "annual"]),
  status: z.enum(["active", "inactive"]),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

const defaultValues: Partial<PlanFormValues> = {
  name: "",
  description: "",
  monthly_cost: "",
  plan_type: "corporate",
  period_type: "monthly",
  status: "active",
};

interface CreatePlanFormProps {
  onSuccess?: () => void;
}

export function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        business_id: businessId,
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