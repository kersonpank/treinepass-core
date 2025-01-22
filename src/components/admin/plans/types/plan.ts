export type PlanType = "individual" | "corporate" | "corporate_subsidized";
export type PeriodType = "monthly" | "quarterly" | "semiannual" | "annual";

export interface Plan {
  id: string;
  business_id: string | null;
  name: string;
  description: string | null;
  monthly_cost: string;
  status: string;
  created_at: string;
  updated_at: string;
  plan_type: PlanType;
  period_type: PeriodType;
  rules: any;
  subsidy_amount: number | null;
  final_user_cost: number | null;
}