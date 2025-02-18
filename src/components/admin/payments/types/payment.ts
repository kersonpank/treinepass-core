
export interface PaymentSettings {
  id: string;
  plan_id: string;
  billing_type: string;
  due_day: number;
  automatic_retry: boolean;
  max_retry_attempts: number;
  created_at?: string;
  updated_at?: string;
}

export interface TransferRule {
  id: string;
  academia_id: string;
  minimum_transfer_amount: number;
  transfer_day: number;
  automatic_transfer: boolean;
  created_at?: string;
  updated_at?: string;
}
