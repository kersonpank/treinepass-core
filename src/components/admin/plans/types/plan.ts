
import { z } from "zod";

export type PlanType = "corporate" | "individual" | "corporate_subsidized";
export type PeriodType = "monthly" | "quarterly" | "semiannual" | "annual";
export type PlanStatus = "active" | "inactive";
export type RenewalType = "automatic" | "manual";
export type PaymentMethod = "credit_card" | "pix" | "boleto";
export type FinancingType = "company_paid" | "employee_paid" | "co_financed";
export type ContributionType = "fixed" | "percentage";

export interface FinancingRules {
  type: FinancingType;
  contribution_type: ContributionType;
  company_contribution: number;
  employee_contribution: number;
}

export interface CheckInRules {
  daily_limit: number | null;
  weekly_limit: number | null;
  monthly_limit: number | null;
  allow_extra_checkins: boolean;
  extra_checkin_cost: number | null;
}

export interface CancellationRules {
  company_can_cancel: boolean;
  user_can_cancel: boolean;
  notice_period_days: number;
}

export interface VolumeDiscount {
  min_employees: number;
  max_employees?: number;
  discount_percentage: number;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  monthly_cost: string;
  plan_type: PlanType;
  period_type: PeriodType;
  status: PlanStatus;
  rules: Record<string, any>;
  financing_rules: FinancingRules;
  linked_plan_id?: string | null;
  base_price?: number | null;
  platform_fee?: number | null;
  renewal_type: RenewalType;
  payment_rules: {
    continue_without_use: boolean;
  };
  category_ids?: string[];
  payment_methods: PaymentMethod[];
  check_in_rules: CheckInRules;
  validity_period?: string;
  auto_renewal: boolean;
  cancellation_rules: CancellationRules;
  employee_limit?: number | null;
  volume_discounts?: VolumeDiscount[];
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
  financing_rules: z.object({
    type: z.enum(["company_paid", "employee_paid", "co_financed"]),
    contribution_type: z.enum(["fixed", "percentage"]),
    company_contribution: z.number().min(0),
    employee_contribution: z.number().min(0)
  }).default({
    type: "company_paid",
    contribution_type: "fixed",
    company_contribution: 0,
    employee_contribution: 0
  }),
  linked_plan_id: z.string().uuid().nullable().optional(),
  base_price: z.number().nullable().optional(),
  platform_fee: z.number().nullable().optional(),
  renewal_type: z.enum(["automatic", "manual"]).default("automatic"),
  payment_rules: z.object({
    continue_without_use: z.boolean()
  }).default({ continue_without_use: true }),
  category_ids: z.array(z.string().uuid()).default([]),
  payment_methods: z.array(z.enum(["credit_card", "pix", "boleto"])).default(["credit_card", "pix", "boleto"]),
  check_in_rules: z.object({
    daily_limit: z.number().nullable(),
    weekly_limit: z.number().nullable(),
    monthly_limit: z.number().nullable(),
    allow_extra_checkins: z.boolean(),
    extra_checkin_cost: z.number().nullable()
  }).default({
    daily_limit: null,
    weekly_limit: null,
    monthly_limit: null,
    allow_extra_checkins: false,
    extra_checkin_cost: null
  }),
  validity_period: z.string().optional(),
  auto_renewal: z.boolean().default(true),
  cancellation_rules: z.object({
    company_can_cancel: z.boolean(),
    user_can_cancel: z.boolean(),
    notice_period_days: z.number()
  }).default({
    company_can_cancel: true,
    user_can_cancel: true,
    notice_period_days: 30
  }),
  employee_limit: z.number().nullable().optional(),
  volume_discounts: z.array(z.object({
    min_employees: z.number(),
    max_employees: z.number().optional(),
    discount_percentage: z.number()
  })).optional()
});

export type PlanFormValues = z.infer<typeof planFormSchema>;
