/**
 * Integração completa com Asaas usando SDK
 */
import { getAsaasConfig, asaasRequest } from './sdk-config.ts';
import { CustomerData, findOrCreateCustomer } from './handlers/sdk-customer.ts';
import { createPaymentLink } from './handlers/sdk-payment-link.ts';
import { createPayment } from './handlers/sdk-payment.ts';
import { handleWebhook } from './handlers/sdk-webhook.ts';

/**
 * Interface para os dados de checkout integrado
 */
export interface IntegratedCheckoutData {
  // Dados do cliente
  customerData: {
    name: string;
    email?: string;
    cpfCnpj: string;
    mobilePhone?: string;
    address?: string;
    addressNumber?: string;
    province?: string;
    postalCode?: string;
  };
  
  // Dados do pagamento
  paymentData: {
    description: string;
    value: number;
    dueDate?: string;
    dueDateLimitDays?: number;
    externalReference?: string;
  };
  
  // Configurações adicionais
  config?: {
    useSavedCustomerData?: boolean; // Se true, usa dados salvos do cliente no Asaas
    billingTypes?: string[]; // Métodos de pagamento permitidos
    maxInstallmentCount?: number;
    callbackUrl?: string;
  };
}

/**
 * Cria um checkout integrado com o Asaas para contratação de planos
 * Esta função gerencia todo o fluxo: verificação/criação de cliente e geração do link de pagamento
 */
export async function createIntegratedCheckout(data: IntegratedCheckoutData, apiKey: string, baseUrl: string) {
  console.log("Iniciando checkout integrado com Asaas:", data);
  
  try {
    // Configurar API Asaas
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // 1. Verificar/criar cliente
    console.log("Verificando/criando cliente...");
    let customerId;
    
    if (data.customerData && !data.config?.useSavedCustomerData) {
      // Criar ou encontrar cliente
      const customerResult = await findOrCreateCustomer(data.customerData, apiKey, baseUrl);
      
      if (customerResult.success && customerResult.customer) {
        customerId = customerResult.customer.id;
        console.log(`Cliente ${customerId} ${customerResult.isNew ? 'criado' : 'encontrado'} com sucesso`);
      } else {
        throw new Error("Falha ao processar dados do cliente");
      }
    } else if (data.customerData.cpfCnpj) {
      // Usar CPF/CNPJ como fallback
      customerId = data.customerData.cpfCnpj.replace(/\D/g, '');
      console.log(`Usando CPF/CNPJ como ID do cliente: ${customerId}`);
    } else {
      throw new Error("Dados do cliente insuficientes");
    }
    
    // 2. Criar link de pagamento associado ao cliente
    console.log("Gerando link de pagamento...");
    const billingTypes = data.config?.billingTypes || ["BOLETO", "CREDIT_CARD", "PIX"];
    const dueDate = data.paymentData.dueDate || calculateDueDate(data.paymentData.dueDateLimitDays || 7);
    
    const paymentLinkData = {
      name: data.paymentData.description,
      description: data.paymentData.description,
      value: data.paymentData.value,
      billingTypes: billingTypes,
      dueDateLimitDays: data.paymentData.dueDateLimitDays || 7,
      dueDate: dueDate,
      externalReference: data.paymentData.externalReference,
      maxInstallmentCount: data.config?.maxInstallmentCount || 1,
      customer: customerId
    };
    
    // Criar link de pagamento diretamente
    console.log("Enviando requisição de link de pagamento:", paymentLinkData);
    const paymentLinkResult = await asaasRequest(config, '/paymentLinks', 'POST', paymentLinkData);
    
    // Verificar e retornar resultado
    if (!paymentLinkResult || !paymentLinkResult.url) {
      throw new Error(`Falha ao gerar link de pagamento: ${JSON.stringify(paymentLinkResult)}`);
    }
    
    // 3. Retornar resultado completo
    return {
      success: true,
      paymentLink: paymentLinkResult.url,
      paymentLinkId: paymentLinkResult.id,
      customerId: customerId,
      value: data.paymentData.value,
      description: data.paymentData.description,
      externalReference: data.paymentData.externalReference
    };
  } catch (error: any) {
    console.error("Erro no checkout integrado:", error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      details: error.response?.data || {}
    };
  }
}

/**
 * Cancela uma assinatura existente no Asaas
 */
export async function cancelSubscription(subscriptionId: string, apiKey: string, baseUrl: string) {
  console.log(`Cancelando assinatura ${subscriptionId}`);
  
  try {
    // Configurar API Asaas
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // Cancelar assinatura
    const result = await asaasRequest(config, `/subscriptions/${subscriptionId}/cancel`, 'POST');
    
    return {
      success: true,
      message: 'Assinatura cancelada com sucesso',
      subscription: result
    };
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      details: error.response?.data || {}
    };
  }
}

/**
 * Processa um webhook do Asaas
 */
export async function processWebhook(event: any, apiKey: string, baseUrl: string, supabase: any) {
  return handleWebhook(event, apiKey, baseUrl, supabase);
}

/**
 * Calcula a data de vencimento baseado no número de dias
 */
function calculateDueDate(days: number = 7): string {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}

/**
 * Verifica o status de um pagamento
 */
export async function checkPaymentStatus(paymentId: string, apiKey: string, baseUrl: string) {
  console.log(`Verificando status do pagamento ${paymentId}`);
  
  try {
    // Configurar API Asaas
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // Buscar pagamento
    const payment = await asaasRequest(config, `/payments/${paymentId}`, 'GET');
    
    return {
      success: true,
      status: payment.status,
      value: payment.value,
      netValue: payment.netValue,
      billingType: payment.billingType,
      paymentDate: payment.paymentDate,
      confirmedDate: payment.confirmedDate,
      customerName: payment.customer?.name || null,
      description: payment.description
    };
  } catch (error: any) {
    console.error("Erro ao verificar status do pagamento:", error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      details: error.response?.data || {}
    };
  }
}
