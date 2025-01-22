import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanRulesConfig } from "./PlanRulesConfig";
import { PlanPreview } from "./PlanPreview";
import { PlanDetailsForm } from "./forms/PlanDetailsForm";
import { type PlanFormValues } from "./types/plan";
import { usePlanForm } from "./hooks/usePlanForm";

interface EditPlanFormProps {
  planId: string;
  onSuccess?: () => void;
}

export function EditPlanForm({ planId, onSuccess }: EditPlanFormProps) {
  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: adminRole } = await supabase
        .from("user_types")
        .select("type")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("type", "admin")
        .maybeSingle();
      return !!adminRole;
    },
  });

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Plano não encontrado");
      return data;
    },
  });

  const { form, isSubmitting, onSubmit } = usePlanForm(planId, onSuccess);

  useEffect(() => {
    if (plan) {
      const formData: PlanFormValues = {
        name: plan.name,
        description: plan.description || "",
        monthly_cost: String(plan.monthly_cost),
        plan_type: plan.plan_type as "corporate" | "individual" | "corporate_subsidized",
        period_type: plan.period_type as "monthly" | "quarterly" | "semiannual" | "annual",
        status: plan.status as "active" | "inactive",
        rules: plan.rules as Record<string, any>,
        subsidy_amount: plan.subsidy_amount ? String(plan.subsidy_amount) : undefined,
        final_user_cost: plan.final_user_cost ? String(plan.final_user_cost) : undefined,
      };
      form.reset(formData);
    }
  }, [plan, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="details">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="rules">Regras</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="details">
            <PlanDetailsForm form={form} />
          </TabsContent>

          <TabsContent value="rules">
            <PlanRulesConfig
              value={form.watch("rules")}
              onChange={(rules) => form.setValue("rules", rules)}
            />
          </TabsContent>

          <TabsContent value="preview">
            <PlanPreview plan={form.getValues() as PlanFormValues} />
          </TabsContent>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </Tabs>
  );
}