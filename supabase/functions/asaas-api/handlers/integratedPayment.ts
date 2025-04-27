/**
 * Handler para fluxo integrado de pagamento
 * Cria/verifica o cliente e gera um link de pagamento associado
 */

import { findOrCreateCustomer } from './customerManagement.ts';

interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

interface IntegratedPaymentData {
  customerData: CustomerData;
  value: number;
  description: string;
  externalReference: string;
  name?: string;
  chargeType?: string;
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  successUrl?: string;
  failureUrl?: string;
}

/**
 * Cria um link de pagamento com cliente já associado
 */
export async function handleIntegratedPayment(data: IntegratedPaymentData, apiKey: string, baseUrl: string) {
  console.log(`Processing integrated payment with data:`, data);
  
  // Validar dados necessários
  if (!data.customerData || !data.value) {
    throw new Error('Customer data and payment value are required');
  }
  
  try {
    // Passo 1: Encontrar ou criar o cliente
    console.log('Step 1: Finding or creating customer...');
    const customerResult = await findOrCreateCustomer(data.customerData, apiKey, baseUrl);
    
    if (!customerResult.success) {
      throw new Error(`Failed to process customer: ${customerResult.message}`);
    }
    
    const customerId = customerResult.customer.id;
    console.log(`Using customer ID: ${customerId} (${customerResult.isNew ? 'new' : 'existing'} customer)`);
    
    // Passo 2: Criar o link de pagamento associado ao cliente
    console.log('Step 2: Creating payment link with customer ID...');
    
    // Obter origin para URLs de callback
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.treinepass.com.br';
    
    // Preparar dados do link de pagamento
    const paymentLinkData = {
      customer: customerId, // Usar o ID do cliente criado/encontrado
      billingTypes: ["BOLETO", "CREDIT_CARD", "PIX"], // Permitir todos os métodos de pagamento
      value: data.value,
      name: data.name || "Pagamento TreinePass",
      description: data.description || "Assinatura de plano", 
      dueDateLimitDays: data.dueDateLimitDays || 5,
      maxInstallmentCount: data.maxInstallmentCount || 12,
      chargeType: data.chargeType || "DETACHED",
      externalReference: data.externalReference,
      notificationEnabled: true,
      // URLs de redirecionamento após pagamento
      successUrl: data.successUrl || `${origin}/payment/success?ref=${data.externalReference || ''}`,
      failureUrl: data.failureUrl || `${origin}/payment/failure?ref=${data.externalReference || ''}`
    };
    
    console.log("Payment link request:", paymentLinkData);
    
    // Fazer requisição à API do Asaas
    const response = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify(paymentLinkData)
    });
    
    // Processar resposta
    const paymentLinkResult = await response.json();
    console.log(`Asaas payment link response:`, paymentLinkResult);
    
    if (!response.ok) {
      throw new Error(`Asaas API error: ${paymentLinkResult.errors?.[0]?.description || paymentLinkResult.message || 'Unknown error'}`);
    }
    
    // Calcular data de vencimento
    const dueDate = data.dueDateLimitDays 
      ? new Date(new Date().setDate(new Date().getDate() + data.dueDateLimitDays)).toISOString().split('T')[0]
      : new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
    
    // Retornar resultado completo
    return {
      success: true,
      customer: customerResult.customer,
      isNewCustomer: customerResult.isNew,
      id: paymentLinkResult.id,
      paymentLink: paymentLinkResult.url,
      value: paymentLinkResult.value,
      dueDate: dueDate,
      externalReference: data.externalReference
    };
  } catch (error) {
    console.error("Error in integrated payment flow:", error);
    throw error;
  }
}
