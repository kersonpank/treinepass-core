import { z } from "zod";

export const planFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  monthly_cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Custo mensal deve ser um número maior que 0",
  }),
  plan_type: z.enum(["corporate", "individual", "corporate_subsidized"]),
  period_type: z.enum(["monthly", "quarterly", "semiannual", "annual"]),
  status: z.enum(["active", "inactive"]),
  subsidy_amount: z.string().optional(),
  final_user_cost: z.string().optional(),
  rules: z.record(z.any()).default({}),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

export type UpdatePlanData = {
  name: string;
  description?: string;
  monthly_cost: number;
  plan_type: "corporate" | "individual" | "corporate_subsidized";
  period_type: "monthly" | "quarterly" | "semiannual" | "annual";
  status: "active" | "inactive";
  rules: Record<string, any>;
  business_id?: string;
  subsidy_amount?: number;
  final_user_cost?: number;
};