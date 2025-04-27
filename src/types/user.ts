// src/types/user.ts

/**
 * Interface aprimorada para o perfil de usuário, incluindo os campos 
 * necessários para integração com o Asaas
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  cpf: string;
  phone: string;
  phone_number: string;
  birth_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  
  // Campos para endereço e pagamento
  postal_code?: string;
  address?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string; // province no Asaas
  city?: string;
  state?: string;
  
  // Campos específicos para integração com Asaas
  asaas_customer_id?: string;
  payment_method?: string;
  
  // Outros campos que possam existir
  [key: string]: any;
}

/**
 * Dados específicos para o Asaas
 */
export interface AsaasCustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

/**
 * Interface para dados de pagamento
 */
export interface PaymentData {
  status: string;
  value: number;
  dueDate: string;
  billingType: string;
  invoiceUrl: string;
  paymentId: string;
  paymentLink?: string;
  pix?: {
    encodedImage?: string;
    payload?: string;
  };
  customerId?: string;
}
