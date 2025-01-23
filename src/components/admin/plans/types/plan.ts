import { z } from "zod";

export type PlanType = "corporate" | "individual" | "corporate_subsidized";
export type PeriodType = "monthly" | "quarterly" | "semiannual" | "annual";
export type PlanStatus = "active" | "inactive";

export interface Plan {
  id: string;
  business_id: string | null;
  name: string;
  description: string | null;
  monthly_cost: string;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
  plan_type: PlanType;
  period_type: PeriodType;
  rules: Record<string, any>;
  subsidy_amount?: number;
  final_user_cost?: number;
}

export const planFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  monthly_cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Custo mensal deve ser um número maior que 0",
  }),
  plan_type: z.enum(["corporate", "individual", "corporate_subsidized"]),
  period_type: z.enum(["monthly", "quarterly", "semiannual", "annual"]),
  status: z.enum(["active", "inactive"]),
  rules: z.record(z.any()).default({}),
  subsidy_amount: z.number().optional(),
  final_user_cost: z.number().optional(),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;