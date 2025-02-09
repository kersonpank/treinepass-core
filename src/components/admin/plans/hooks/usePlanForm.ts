
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { planFormSchema, type PlanFormValues } from "../types/plan";

export function usePlanForm(mode: "new" | "edit", onSuccess?: () => void) {
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
      payment_rules: {
        continue_without_use: true
      },
      employee_limit: null,
      renewal_type: "automatic",
      category_ids: [],
      check_in_rules: {
        daily_limit: null,
        weekly_limit: null,
        monthly_limit: null,
        allow_extra_checkins: false,
        extra_checkin_cost: null
      }
    },
  });

  const onSubmit = async (data: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare base plan data
      const basePlanData = {
        name: data.name,
        description: data.description,
        monthly_cost: data.monthly_cost ? Number(data.monthly_cost) : 0,
        plan_type: data.plan_type,
        period_type: data.period_type,
        status: data.status,
        rules: data.rules || {},
        financing_rules: data.financing_rules,
        employee_limit: data.employee_limit,
        payment_rules: data.payment_rules,
        check_in_rules: data.check_in_rules,
        renewal_type: data.renewal_type,
        cancellation_rules: {
          company_can_cancel: true,
          user_can_cancel: true,
          notice_period_days: 30
        }
      };

      // Criar plano principal
      const { data: mainPlan, error: mainPlanError } = await supabase
        .from("benefit_plans")
        .insert(basePlanData)
        .select()
        .single();

      if (mainPlanError) {
        console.error("Erro ao criar plano principal:", mainPlanError);
        throw mainPlanError;
      }

      // Se houver categorias selecionadas, criar relacionamentos plano-categoria
      if (data.category_ids?.length > 0) {
        const planCategories = data.category_ids.map(categoryId => ({
          plan_id: mainPlan.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from("plan_categories")
          .insert(planCategories);

        if (categoriesError) {
          console.error("Erro ao criar categorias:", categoriesError);
          throw categoriesError;
        }
      }

      // Se for plano subsidiado, criar plano vinculado para o funcionário
      if (data.plan_type === "corporate_subsidized") {
        const employeeCost = data.financing_rules.contribution_type === "fixed"
          ? data.financing_rules.employee_contribution
          : (Number(data.monthly_cost) * data.financing_rules.employee_contribution) / 100;

        const employeePlanData = {
          ...basePlanData,
          name: `${data.name} (Funcionário)`,
          linked_plan_id: mainPlan.id,
          monthly_cost: employeeCost,
          plan_type: "individual",
          financing_rules: {
            type: "employee_paid",
            contribution_type: "fixed",
            company_contribution: 0,
            employee_contribution: employeeCost
          }
        };

        const { error: employeePlanError } = await supabase
          .from("benefit_plans")
          .insert(employeePlanData);

        if (employeePlanError) {
          console.error("Erro ao criar plano do funcionário:", employeePlanError);
          throw employeePlanError;
        }
      }

      toast({
        title: "Plano criado com sucesso!",
        description: mode === "new" 
          ? "O novo plano foi adicionado ao sistema."
          : "O plano foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["plans"] });
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar plano:", error);
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
