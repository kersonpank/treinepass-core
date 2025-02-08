
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
      financing_rules: {
        type: "company_paid",
        contribution_type: "fixed",
        company_contribution: 0,
        employee_contribution: 0
      },
      employee_limit: null
    },
  });

  const onSubmit = async (data: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      // Criar plano principal
      const planData = {
        name: data.name,
        description: data.description,
        monthly_cost: Number(data.monthly_cost),
        plan_type: data.plan_type,
        period_type: data.period_type,
        status: data.status,
        rules: data.rules,
        financing_rules: data.financing_rules,
        employee_limit: data.employee_limit,
        base_price: data.base_price,
        platform_fee: data.platform_fee,
        renewal_type: data.renewal_type,
        payment_rules: data.payment_rules,
        payment_methods: data.payment_methods,
        check_in_rules: data.check_in_rules,
        auto_renewal: data.auto_renewal,
        cancellation_rules: data.cancellation_rules
      };

      const { data: mainPlan, error: mainPlanError } = await supabase
        .from("benefit_plans")
        .insert(planData)
        .select()
        .single();

      if (mainPlanError) throw mainPlanError;

      // Se for cofinanciado, criar plano vinculado para o funcionário
      if (data.financing_rules.type === "co_financed") {
        const employeePlanData = {
          ...planData,
          name: `${data.name} (Funcionário)`,
          linked_plan_id: mainPlan.id,
          monthly_cost: data.financing_rules.contribution_type === "fixed"
            ? data.financing_rules.employee_contribution
            : (Number(data.monthly_cost) * data.financing_rules.employee_contribution) / 100
        };

        const { error: employeePlanError } = await supabase
          .from("benefit_plans")
          .insert(employeePlanData);

        if (employeePlanError) throw employeePlanError;
      }

      // Criar relacionamentos com categorias
      if (data.category_ids.length > 0) {
        const planCategories = data.category_ids.map(categoryId => ({
          plan_id: mainPlan.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from("plan_categories")
          .insert(planCategories);

        if (categoriesError) throw categoriesError;
      }

      // Criar primeira versão do plano
      const { error: versionError } = await supabase
        .from("plan_versions")
        .insert({
          plan_id: mainPlan.id,
          name: data.name,
          description: data.description,
          monthly_cost: Number(data.monthly_cost),
          rules: data.rules,
          version: 1,
        });

      if (versionError) throw versionError;

      toast({
        title: "Plano criado com sucesso!",
        description: "O novo plano foi adicionado ao sistema.",
      });

      queryClient.invalidateQueries({ queryKey: ["plans"] });
      form.reset();
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

  return {
    form,
    isSubmitting,
    onSubmit,
  };
}
