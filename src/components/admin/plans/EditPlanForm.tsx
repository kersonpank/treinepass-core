import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanRulesConfig } from "./PlanRulesConfig";
import { PlanPreview } from "./PlanPreview";
import { PlanDetailsForm } from "./forms/PlanDetailsForm";
import { planFormSchema, type PlanFormValues, type UpdatePlanData } from "./types/plan";

interface EditPlanFormProps {
  planId: string;
  onSuccess?: () => void;
}

export function EditPlanForm({ planId, onSuccess }: EditPlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
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

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      monthly_cost: "",
      plan_type: "corporate",
      period_type: "monthly",
      status: "active",
      rules: {},
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        monthly_cost: String(plan.monthly_cost),
        plan_type: plan.plan_type as "corporate" | "individual",
        period_type: plan.period_type as "monthly" | "quarterly" | "semiannual" | "annual",
        status: plan.status as "active" | "inactive",
        rules: plan.rules || {},
      });
    }
  }, [plan, form]);

  const onSubmit = async (data: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      // Create a new version of the plan
      const { data: newVersion, error: versionError } = await supabase
        .from("plan_versions")
        .insert({
          plan_id: planId,
          name: data.name,
          description: data.description,
          monthly_cost: Number(data.monthly_cost),
          rules: data.rules,
          version: 1, // TODO: Increment version number
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update the current plan
      const updateData: UpdatePlanData = {
        name: data.name,
        description: data.description,
        monthly_cost: Number(data.monthly_cost),
        plan_type: data.plan_type,
        period_type: data.period_type,
        status: data.status,
        rules: data.rules,
      };

      // If not admin and plan exists, we need the business_id
      if (!isAdmin && plan) {
        updateData.business_id = plan.business_id;
      }

      const { error: updateError } = await supabase
        .from("benefit_plans")
        .update(updateData)
        .eq("id", planId);

      if (updateError) throw updateError;

      // Record the change in history
      const { error: historyError } = await supabase
        .from("plan_change_history")
        .insert({
          plan_id: planId,
          version_id: newVersion.id,
          changes: updateData,
        });

      if (historyError) throw historyError;

      toast({
        title: "Plano atualizado com sucesso!",
        description: "As alterações foram salvas e versionadas.",
      });

      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      onSuccess?.();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar plano",
        description: "Não foi possível atualizar o plano. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <PlanPreview plan={form.getValues()} />
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