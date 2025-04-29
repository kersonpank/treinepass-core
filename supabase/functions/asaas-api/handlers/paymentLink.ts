
interface CustomerData {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

interface PaymentLinkData {
  customer?: string; // ID do cliente
  customerData?: CustomerData; // Dados do cliente para criar um novo
  billingType?: string;
  value: number;
  name?: string;
  description?: string;
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  externalReference?: string;
  successUrl?: string;
  failureUrl?: string;
}

import { handleCreateCustomer } from './customer';

export async function handleCreatePaymentLink(data: PaymentLinkData, apiKey: string, baseUrl: string) {
  console.log(`Creating payment link with data:`, data);
  
  // Validate required fields
  if (!data.value) {
    throw new Error('Payment value is required');
  }
  
  // Se temos dados do cliente, verificar se o cliente existe ou criar um novo
  let customerId = data.customer;
  
  if (!customerId && data.customerData) {
    try {
      console.log('Creating or finding customer with data:', data.customerData);
      const customerResult = await handleCreateCustomer(data.customerData, apiKey, baseUrl);
      customerId = customerResult.id;
      console.log(`Using customer ID: ${customerId} (${customerResult.isExistingCustomer ? 'existing' : 'new'} customer)`);
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      // Continuar sem o customer ID - o Asaas pode criar o cliente durante o checkout
    }
  }
  
  // Obter URL base para redirecionamentos
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.treinepass.com.br';
  
  // Preparar dados para o link de pagamento
  const paymentLinkData = {
    name: data.name || "Pagamento",
    description: data.description || "Pagamento via Asaas", 
    value: data.value,
    dueDateLimitDays: data.dueDateLimitDays || 5,
    externalReference: data.externalReference,
    billingType: "UNDEFINED", // Cliente escolhe no checkout
    maxInstallmentCount: data.maxInstallmentCount || 12,
    chargeType: "DETACHED",
    notificationEnabled: true,
    // URLs de redirecionamento
    successUrl: data.successUrl || `${origin}/payment/success?ref=${data.externalReference || ''}`,
    failureUrl: data.failureUrl || `${origin}/payment/failure?ref=${data.externalReference || ''}`
  };
  
  // Adicionar customerID se disponível
  if (customerId) {
    Object.assign(paymentLinkData, { customer: customerId });
  }
  
  console.log("Sending to Asaas API:", paymentLinkData);
  
  try {
    // Fazer requisição para a API do Asaas
    const response = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentLinkData)
    });
    
    // Log da resposta bruta para debug
    const responseText = await response.text();
    console.log(`Raw Asaas response:`, responseText);
    
    // Parse da resposta
    const paymentLinkResult = JSON.parse(responseText);
    console.log(`Asaas payment link response:`, paymentLinkResult);
    
    if (!response.ok) {
      throw new Error(`Asaas API error: ${paymentLinkResult.errors?.[0]?.description || paymentLinkResult.message || 'Unknown error'}`);
    }
    
    // Calcular data de vencimento se não fornecida
    const dueDate = data.dueDateLimitDays 
      ? new Date(new Date().setDate(new Date().getDate() + data.dueDateLimitDays)).toISOString().split('T')[0]
      : new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];

    // Retornar dados do link de pagamento
    return {
      success: true,
      id: paymentLinkResult.id,
      url: paymentLinkResult.url,
      paymentLink: paymentLinkResult.url,
      value: paymentLinkResult.value,
      dueDate: dueDate,
      externalReference: data.externalReference
    };
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw error;
  }
}
