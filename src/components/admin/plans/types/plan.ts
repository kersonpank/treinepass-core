
export interface PlanFormValues {
  name: string;
  status: 'active' | 'inactive';
  rules: Record<string, any>;
  description?: string;
  linked_plan_id?: string;
  auto_renewal?: boolean;
  base_price?: number;
  cancellation_rules?: {
    user_can_cancel: boolean;
    company_can_cancel: boolean;
    notice_period_days: number;
  };
  check_in_rules?: {
    daily_limit: number | null;
    weekly_limit: number | null;
    monthly_limit: number | null;
  };
  employee_limit?: number;
  financing_rules?: {
    type: string;
    contribution_type: string;
    employee_contribution: number;
    company_contribution: number;
  };
  monthly_cost: number;
  payment_rules?: {
    continue_without_use: boolean;
  };
  payment_methods?: string[];
  period_type?: string;
  plan_type?: string;
  subsidy_amount?: number;
  volume_discounts?: {
    min_employees: number;
    max_employees?: number;
    discount_percentage: number;
  }[];
}

export interface PlanDetailsFormProps {
  form: UseFormReturn<PlanFormValues>;
}
