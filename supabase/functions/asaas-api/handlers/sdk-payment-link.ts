
/**
 * Handler for payment links using the Asaas SDK
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
  customer?: string; // ID of the customer or CPF/CNPJ
  successUrl?: string;
  failureUrl?: string;
}

/**
 * Creates a payment link using the Asaas SDK
 */
export async function createPaymentLink(data: PaymentLinkData, apiKey: string, baseUrl: string) {
  console.log("Creating payment link with SDK:", data);
  
  try {
    // Configure Asaas API
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // Validate required data
    if (!data.name || !data.value) {
      throw new Error("Name and value are required");
    }
    
    // Define default billing types
    const billingTypeArray = data.billingTypes || ["BOLETO", "CREDIT_CARD", "PIX"];
    
    // If customer data provided, find or create the customer
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
        // Continue with CPF/CNPJ as fallback
        if (data.customerData.cpfCnpj) {
          customerId = data.customerData.cpfCnpj.replace(/\D/g, '');
          console.log(`Using CPF/CNPJ as fallback: ${customerId}`);
        }
      }
    }
    
    // Prepare data for the payment link
    const paymentLinkData = {
      name: data.name,
      description: data.description,
      value: data.value,
      billingTypes: billingTypeArray, // API v3 format
      dueDateLimitDays: data.dueDateLimitDays || 30,
      dueDate: data.dueDate,
      externalReference: data.externalReference,
      maxInstallmentCount: data.maxInstallmentCount,
      expirationDate: data.expirationDate,
      customer: customerId,
      callbackUrl: data.successUrl,
      cancelUrl: data.failureUrl
    };
    
    // Create payment link
    const paymentLink = await asaasRequest(config, '/paymentLinks', 'POST', paymentLinkData);
    
    // Return standardized response
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
