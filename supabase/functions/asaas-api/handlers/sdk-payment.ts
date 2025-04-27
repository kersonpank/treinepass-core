/**
 * Handler para pagamentos usando o SDK do Asaas
 */
import { getAsaasClient } from '../sdk-config.ts';

export interface PaymentData {
  customer: string;
  billingType?: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  postalService?: boolean;
  fine?: {
    value: number;
  };
  interest?: {
    value: number;
  };
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  split?: any[];
}

export async function createPayment(data: PaymentData, apiKey: string, baseUrl: string) {
  console.log("Creating payment with SDK:", data);
  
  try {
    // Criar cliente Asaas
    const asaas = getAsaasClient(apiKey, baseUrl.includes('api.asaas.com'));
    
    // Validar dados obrigatórios
    if (!data.customer || !data.value || !data.dueDate) {
      throw new Error("Customer, value and dueDate are required");
    }
    
    // Definir billingType padrão se não for fornecido
    if (!data.billingType) {
      data.billingType = 'BOLETO';
    }
    
    // Criar pagamento usando o SDK
    const payment = await asaas.createNewPayment({
      body: {
        customer: data.customer,
        billingType: data.billingType as any,
        value: data.value,
        dueDate: data.dueDate,
        description: data.description,
        externalReference: data.externalReference,
        postalService: data.postalService || false,
        fine: data.fine,
        interest: data.interest,
        discount: data.discount,
        split: data.split
      }
    });
    
    // Montar resposta padronizada
    const paymentResponse = {
      success: true,
      id: payment.id,
      status: payment.status,
      value: payment.value,
      netValue: payment.netValue,
      description: payment.description,
      billingType: payment.billingType,
      customer: payment.customer,
      dueDate: payment.dueDate,
      invoiceUrl: payment.invoiceUrl || null,
      bankSlipUrl: payment.bankSlipUrl || null,
      paymentLink: null
    };
    
    // Adicionar informações específicas do tipo de pagamento
    if (payment.billingType === 'PIX') {
      paymentResponse.paymentLink = payment.invoiceUrl;
    } else if (payment.billingType === 'BOLETO') {
      paymentResponse.paymentLink = payment.bankSlipUrl;
    } else if (payment.billingType === 'CREDIT_CARD') {
      paymentResponse.paymentLink = payment.invoiceUrl;
    }
    
    return paymentResponse;
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error.response?.data || {}
    };
  }
}
