import { supabase } from "@/integrations/supabase/client";
import { Plan, PlanFormValues } from "@/components/admin/plans/types/plan";

export async function updatePlan(planId: string, data: PlanFormValues) {
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
      final_user_cost: data.final_user_cost,
      base_price: data.base_price,
      platform_fee: data.platform_fee,
      renewal_type: data.renewal_type,
      payment_rules: data.payment_rules,
      category_id: data.category_id,
      payment_methods: data.payment_methods,
      check_in_rules: data.check_in_rules,
      validity_period: data.validity_period,
      auto_renewal: data.auto_renewal,
      cancellation_rules: data.cancellation_rules
    })
    .eq("id", planId);

  if (error) throw error;
}

export async function createPlanVersion(planId: string, data: PlanFormValues) {
  const { data: versions, error: versionsError } = await supabase
    .from("plan_versions")
    .select("version")
    .eq("plan_id", planId)
    .order("version", { ascending: false })
    .limit(1);

  if (versionsError) throw versionsError;

  const nextVersion = versions && versions.length > 0 ? versions[0].version + 1 : 1;

  const { error } = await supabase
    .from("plan_versions")
    .insert({
      plan_id: planId,
      version: nextVersion,
      name: data.name,
      description: data.description,
      monthly_cost: Number(data.monthly_cost),
      rules: data.rules
    });

  if (error) throw error;
}

export async function getPlanVersions(planId: string) {
  const { data, error } = await supabase
    .from("plan_versions")
    .select("*")
    .eq("plan_id", planId)
    .order("version", { ascending: false });

  if (error) throw error;
  return data;
}