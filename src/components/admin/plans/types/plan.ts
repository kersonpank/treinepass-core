
import { UseFormReturn } from "react-hook-form";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  plan_type: string;
  period_type: string;
  monthly_cost: string;
  base_price?: number;
  platform_fee?: number;
  rules: Record<string, any>;
  check_in_rules?: {
    daily_limit: number | null;
    weekly_limit: number | null;
    monthly_limit: number | null;
    allow_extra_checkins?: boolean;
    extra_checkin_cost?: number;
  };
  auto_renewal?: boolean;
  renewal_type?: string;
  payment_rules?: {
    continue_without_use: boolean;
  };
  financing_rules?: {
    type: string;
    contribution_type: string;
    employee_contribution: number;
    company_contribution: number;
  };
  cancellation_rules?: {
    user_can_cancel: boolean;
    company_can_cancel: boolean;
    notice_period_days: number;
  };
  employee_limit?: number;
  volume_discounts?: {
    min_employees: number;
    max_employees?: number;
    discount_percentage: number;
  }[];
  category_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PlanFormValues extends Omit<Plan, 'id' | 'monthly_cost'> {
  monthly_cost: number;
}

export interface PlanDetailsFormProps {
  form: UseFormReturn<PlanFormValues>;
}

export const planFormSchema = {
  // Schema validation aqui se necessário
};
