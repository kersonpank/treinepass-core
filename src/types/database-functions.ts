
/**
 * Type definitions for database function responses
 */

// Response from generate_mobile_access_token RPC function
export interface GenerateMobileAccessTokenResponse {
  can_check_in: boolean;
  message: string;
  access_token?: string;
  expires_at?: string;
}

// Response from validate_check_in_rules RPC function
export interface ValidateCheckInRulesResponse {
  can_check_in: boolean;
  message: string;
  remaining_daily: number;
  remaining_weekly: number;
  remaining_monthly: number;
  valor_repasse?: number;
  plano_id?: string;
  valor_plano?: number;
}

// Response from process_asaas_webhook RPC function
export interface ProcessAsaasWebhookResponse {
  success: boolean;
  message: string;
  event: string;
  status?: string;
  payment_id?: string;
  subscription_id?: string;
  payment_status?: string;
  webhook_event_id?: string;
}

// Add this to the list of valid RPC function names
export type ValidRpcFunctions = 
  | "asaas_api"
  | "calculate_financial_metrics"
  | "calculate_plan_proration"
  | "can_user_check_in"
  | "check_and_expire_plans"
  | "check_employee_limit"
  | "check_subscription_status"
  | "generate_mobile_access_token"
  | "get_academia_details"
  | "get_academia_stats"
  | "get_admin_stats"
  | "get_check_in_stats"
  | "get_financial_stats"
  | "get_gym_check_in_stats"
  | "get_plan_stats"
  | "get_user_details"
  | "process_asaas_webhook"
  | "reprocess_failed_webhook_event"
  | "update_academia_details"
  | "update_plan_details"
  | "update_user_details"
  | "validate_check_in_rules"
  | "validate_gym_check_in";
