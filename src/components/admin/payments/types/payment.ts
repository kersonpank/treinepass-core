
export interface PaymentSetting {
  id: string;
  plan_id: string;
  billing_type: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'PREPAID' | 'POSTPAID';
  due_day: number;
  automatic_retry: boolean;
  max_retry_attempts: number;
  created_at: string;
  updated_at: string;
  benefit_plans?: {
    name: string;
  };
}
