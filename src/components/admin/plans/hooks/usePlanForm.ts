import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { planFormSchema, type PlanFormValues } from "../types/plan";

export function usePlanForm(planId: string, onSuccess?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const onSubmit = async (data: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: newVersion, error: versionError } = await supabase
        .from("plan_versions")
        .insert({
          plan_id: planId,
          name: data.name,
          description: data.description,
          monthly_cost: Number(data.monthly_cost),
          rules: data.rules,
          version: 1,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      const updateData = {
        name: data.name,
        description: data.description,
        monthly_cost: Number(data.monthly_cost),
        plan_type: data.plan_type,
        period_type: data.period_type,
        status: data.status,
        rules: data.rules,
        subsidy_amount: data.subsidy_amount ? Number(data.subsidy_amount) : null,
        final_user_cost: data.final_user_cost ? Number(data.final_user_cost) : null,
      };

      const { error: updateError } = await supabase
        .from("benefit_plans")
        .update(updateData)
        .eq("id", planId);

      if (updateError) throw updateError;

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

  return {
    form,
    isSubmitting,
    onSubmit,
  };
}