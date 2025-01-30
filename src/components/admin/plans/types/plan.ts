import { z } from "zod";

export type PlanType = "corporate" | "individual" | "corporate_subsidized";
export type PeriodType = "monthly" | "quarterly" | "semiannual" | "annual";
export type PlanStatus = "active" | "inactive";
export type RenewalType = "automatic" | "manual";

export interface Plan {
  id: string;
  business_id: string | null;
  name: string;
  description?: string;
  monthly_cost: string;
  plan_type: PlanType;
  period_type: PeriodType;
  status: PlanStatus;
  rules: Record<string, any>;
  subsidy_amount?: number;
  final_user_cost?: number;
  base_price?: number;
  platform_fee?: number;
  renewal_type: RenewalType;
  payment_rules?: {
    continue_without_use: boolean;
  };
  created_at: string;
  updated_at: string;
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
  base_price: z.number().optional(),
  platform_fee: z.number().optional(),
  renewal_type: z.enum(["automatic", "manual"]).default("automatic"),
  payment_rules: z.object({
    continue_without_use: z.boolean()
  }).default({ continue_without_use: true }),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;