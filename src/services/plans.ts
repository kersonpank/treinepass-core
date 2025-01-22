import { supabase } from "@/integrations/supabase/client";

interface PlanData {
  name: string;
  description?: string;
  monthly_cost: string;
  plan_type: "corporate" | "individual" | "corporate_subsidized";
  period_type: "monthly" | "quarterly" | "semiannual" | "annual";
  status: "active" | "inactive";
  rules: Record<string, any>;
  subsidy_amount?: number;
  final_user_cost?: number;
}

export async function updatePlan(planId: string, data: PlanData) {
  const { error } = await supabase
    .from("benefit_plans")
    .update({
      name: data.name,
      description: data.description,
      monthly_cost: Number(data.monthly_cost),
      plan_type: data.plan_type,
      period_type: data.period_type,
      status: data.status,
      rules: data.rules,
      subsidy_amount: data.subsidy_amount,
      final_user_cost: data.final_user_cost
    })
    .eq("id", planId);

  if (error) throw error;
}