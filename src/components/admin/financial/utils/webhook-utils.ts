
type NestedValue = string | number | boolean | null | undefined;

type PaymentMethod = 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED';
type PaymentCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';

export const EVENT_TYPE_MAPPING: Record<string, string> = {
  "PAYMENT_CREATED": "Pagamento Criado",
  "PAYMENT_UPDATED": "Pagamento Atualizado",
  "PAYMENT_CONFIRMED": "Pagamento Confirmado",
  "PAYMENT_RECEIVED": "Pagamento Recebido",
  "PAYMENT_OVERDUE": "Pagamento Atrasado",
  "PAYMENT_DELETED": "Pagamento Excluído",
  "PAYMENT_REFUNDED": "Pagamento Reembolsado",
  "PAYMENT_RECEIVED_IN_CASH": "Pagamento Recebido em Dinheiro",
  "PAYMENT_REFUND_REQUESTED": "Reembolso Solicitado",
  "SUBSCRIPTION_CREATED": "Assinatura Criada",
  "SUBSCRIPTION_UPDATED": "Assinatura Atualizada",
  "SUBSCRIPTION_DELETED": "Assinatura Excluída",
  "SUBSCRIPTION_RENEWED": "Assinatura Renovada"
};

export interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  postalCode?: string;
}

export interface AsaasSubscriptionData {
  customer: string; // Asaas customer ID
  billingType: PaymentMethod;
  nextDueDate?: string;
  value: number;
  cycle: PaymentCycle;
  description?: string;
  externalReference?: string;
  updatePendingPayments?: boolean;
}

export const getEventTypeLabel = (eventType: string): string => {
  return EVENT_TYPE_MAPPING[eventType] || eventType;
};

export const getNestedValue = (
  obj: any, 
  path: string, 
  defaultValue: NestedValue = null
): NestedValue => {
  try {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    
    return result || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const calculateNextDueDate = (days: number = 7): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const cleanupCpfCnpj = (cpfCnpj: string): string => {
  return cpfCnpj.replace(/[^\d]/g, '');
};
