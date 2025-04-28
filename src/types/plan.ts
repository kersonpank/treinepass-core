
// Add missing types for plan features
export interface Plan {
  id: string;
  name: string;
  description: string;
  monthly_cost: number;
  status: 'active' | 'inactive' | 'draft';
  plan_type: 'individual' | 'corporate' | 'corporate_subsidized';
  payment_methods: string[];
  check_in_rules: {
    daily_limit: number | null;
    weekly_limit: number | null;
    monthly_limit: number | null;
    extra_checkin_cost: number | null;
    allow_extra_checkins: boolean;
  };
  auto_renewal: boolean;
  cancellation_rules: {
    user_can_cancel: boolean;
    company_can_cancel: boolean;
    notice_period_days: number;
  };
  // Add other required fields
  period_type: 'monthly' | 'yearly' | 'quarterly' | 'semiannually';
  renewal_type: 'automatic' | 'manual';
  rules: Record<string, any>;
  payment_rules: Record<string, any>;
  
  // Optional fields that might not exist in all records
  features?: string[];
  base_price?: number;
  platform_fee?: number;
  annual_discount?: number;
  corporate_discount?: number;
}
