/**
 * Handler para links de pagamento usando o SDK do Asaas
 */
import { getAsaasConfig, asaasRequest } from '../sdk-config.ts';
import { CustomerData, findOrCreateCustomer } from './sdk-customer.ts';

export interface PaymentLinkData {
  name: string;
  description?: string;
  value: number;
  billingType?: string;
  billingTypes?: string[];
  dueDateLimitDays?: number;
  dueDate?: string;
  externalReference?: string;
  maxInstallmentCount?: number;
  expirationDate?: string;
  customerData?: CustomerData;
  customer?: string; // ID do cliente ou CPF/CNPJ
}

/**
 * Cria um link de pagamento usando o SDK do Asaas
 */
export async function createPaymentLink(data: PaymentLinkData, apiKey: string, baseUrl: string) {
  console.log("Creating payment link with SDK:", data);
  
  try {
    // Configurar API Asaas
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // Validar dados obrigatu00f3rios
    if (!data.name || !data.value) {
      throw new Error("Name and value are required");
    }
    
    // Definir billingTypes padru00e3o
    const billingTypeArray = data.billingTypes || ["BOLETO", "CREDIT_CARD", "PIX"];
    
    // Se foram enviados dados do cliente, criar/buscar o cliente
    let customerId = data.customer;
    
    if (data.customerData && !customerId) {
      try {
        console.log("Customer data provided, finding or creating customer:", data.customerData);
        const customerResult = await findOrCreateCustomer(data.customerData, apiKey, baseUrl);
        
        if (customerResult.success && customerResult.customer) {
          customerId = customerResult.customer.id;
          console.log(`Using customer ID: ${customerId}`);
        }
      } catch (customerError) {
        console.error("Error processing customer data:", customerError);
        // Continuar com o CPF/CNPJ como fallback
        if (data.customerData.cpfCnpj) {
          customerId = data.customerData.cpfCnpj.replace(/\D/g, '');
          console.log(`Using CPF/CNPJ as fallback: ${customerId}`);
        }
      }
    }
    
    // Preparar dados para o link de pagamento
    const paymentLinkData = {
      name: data.name,
      description: data.description,
      value: data.value,
      billingTypes: billingTypeArray, // Corrigido para a API v3
      dueDateLimitDays: data.dueDateLimitDays || 30,
      dueDate: data.dueDate,
      externalReference: data.externalReference,
      maxInstallmentCount: data.maxInstallmentCount,
      expirationDate: data.expirationDate,
      customer: customerId
    };
    
    // Criar link de pagamento
    const paymentLink = await asaasRequest(config, '/paymentLinks', 'POST', paymentLinkData);
    
    // Retornar resposta padronizada
    return {
      success: true,
      id: paymentLink.id,
      url: paymentLink.url,
      description: data.description,
      value: data.value,
      externalReference: data.externalReference,
      customerId: customerId
    };
  } catch (error: any) {
    console.error("Error creating payment link:", error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error.response?.data || {}
    };
  }
}
