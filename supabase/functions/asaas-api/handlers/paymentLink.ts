
/**
 * Interface for customer data
 */
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

/**
 * Interface for payment link data
 */
interface PaymentLinkData {
  customer?: string; // ID do cliente (opcional se customerData for fornecido)
  customerData?: CustomerData; // Dados do cliente para criar ou verificar
  billingType?: string; // Mantido para compatibilidade com código existente
  billingTypes?: string[]; // Mantido para compatibilidade com código existente
  paymentMethodCodes?: string[]; // Novo campo para compatibilidade com a API v3 do Asaas
  value: number;
  name?: string;
  description?: string;
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  chargeType?: string;
  externalReference?: string;
  notificationEnabled?: boolean;
  successUrl?: string;
  failureUrl?: string;
  callbackUrl?: string;
}

import { handleCreateCustomer } from './customer';

/**
 * Creates a payment link in Asaas
 */
export async function handleCreatePaymentLink(data: PaymentLinkData, apiKey: string, baseUrl: string) {
  console.log(`Creating payment link with data:`, data);
  
  // Validate required fields
  if (!data.value) {
    throw new Error('Payment link data incomplete. Value is required.');
  }
  
  // Verificar se temos os dados do cliente ou apenas o CPF/CNPJ
  let customerId = data.customer;
  let customerData = data.customerData;
  
  // Garantir compatibilidade com a versu00e3o implantada no Supabase
  // Se nu00e3o temos customer nem customerData, lancu00e7ar erro com a mensagem original
  if (!customerId && !customerData) {
    throw new Error('Payment link data incomplete. Customer and value are required.');
  }
  
  // Se temos dados do cliente, verificar se o cliente já existe ou criar um novo
  if (customerData) {
    try {
      console.log('Checking if customer exists or creating a new one...');
      const customerResult = await handleCreateCustomer({
        name: customerData.name,
        cpfCnpj: customerData.cpfCnpj,
        email: customerData.email,
        mobilePhone: customerData.mobilePhone || customerData.phone,
        phone: customerData.phone,
        address: customerData.address,
        addressNumber: customerData.addressNumber,
        complement: customerData.complement,
        province: customerData.province,
        postalCode: customerData.postalCode,
        externalReference: customerData.externalReference || data.externalReference
      }, apiKey, baseUrl);
      
      // Usar o ID do cliente retornado
      customerId = customerResult.id;
      console.log(`Using customer ID: ${customerId} (${customerResult.isExistingCustomer ? 'existing' : 'new'} customer)`);
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      // Se falhar a criação do cliente, continuar com o ID fornecido originalmente
      console.log(`Falling back to provided customer ID: ${customerId}`);
      
      // Se nu00e3o temos customer ID e falhou a criau00e7u00e3o, usar o CPF como fallback
      if (!customerId && customerData && customerData.cpfCnpj) {
        customerId = customerData.cpfCnpj;
        console.log(`Using CPF/CNPJ as customer ID fallback: ${customerId}`);
      }
    }
  }
  
  // Get origin for callback URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.treinepass.com.br';
  
  // Prepare payment link request body with improved metadata
  const paymentLinkData: any = {
    customer: customerId, // Usar o ID do cliente que obtivemos (existente ou recém-criado)
    value: data.value,
    name: data.name || "Assinatura de Plano",
    description: data.description || "Assinatura de plano", 
    dueDateLimitDays: data.dueDateLimitDays || 5,
    maxInstallmentCount: data.maxInstallmentCount || 12, // Allow up to 12 installments
    chargeType: data.chargeType || "DETACHED",
    externalReference: data.externalReference,
    notificationEnabled: true,
    // URLs de redirecionamento após pagamento
    successUrl: data.successUrl || `${origin}/payment/success?ref=${data.externalReference || ''}`,
    failureUrl: data.failureUrl || `${origin}/payment/failure?ref=${data.externalReference || ''}`,
    // Parâmetros críticos para o funcionamento correto
    showCustomerData: false, // Impedir que o Asaas solicite os dados do cliente no checkout
    paymentMethodCodes: ["BOLETO", "CREDIT_CARD", "PIX"] // Suportar múltiplos métodos de pagamento (API v3)
  };
  
  // Remover campos antigos para evitar conflitos
  if (paymentLinkData.billingType) {
    delete paymentLinkData.billingType;
  }
  if (paymentLinkData.billingTypes) {
    delete paymentLinkData.billingTypes;
  }
  
  // Log para debug
  console.log("Final payment link data being sent to Asaas:", JSON.stringify(paymentLinkData));
  
  console.log(`Creating payment link for customer ID: ${customerId}`);
  

  console.log("Payment link request:", paymentLinkData);
  
  try {
    // Converter para string JSON e depois fazer parse novamente para garantir que nu00e3o hu00e1 problemas de serializau00e7u00e3o
    const payloadString = JSON.stringify(paymentLinkData);
    const parsedPayload = JSON.parse(payloadString);
    
    // Verificar se os paru00e2metros cru00edticos estu00e3o presentes apu00f3s a serializau00e7u00e3o
    console.log("Verificando payload final:", {
      showCustomerData: parsedPayload.showCustomerData,
      paymentMethodCodes: parsedPayload.paymentMethodCodes,
      hasBillingTypes: 'billingTypes' in parsedPayload,
      hasBillingType: 'billingType' in parsedPayload
    });
    
    // Make API request to Asaas
    console.log(`Sending request to ${baseUrl}/paymentLinks with payload:`, payloadString);
    const asaasResponse = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: payloadString // Usar a string serializada diretamente
    });
    
    // Log da resposta bruta para debug
    const responseText = await asaasResponse.text();
    console.log(`Raw Asaas response:`, responseText);
    
    // Parse response
    const paymentLinkResult = JSON.parse(responseText);
    console.log(`Asaas payment link response:`, paymentLinkResult);
    
    if (!asaasResponse.ok) {
      throw new Error(`Asaas API error: ${paymentLinkResult.errors?.[0]?.description || paymentLinkResult.message || 'Unknown error'}`);
    }
    
    // Calculate due date if not provided
    const dueDate = data.dueDateLimitDays 
      ? new Date(new Date().setDate(new Date().getDate() + data.dueDateLimitDays)).toISOString().split('T')[0]
      : new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];

    // Return payment link data with all needed information
    return {
      success: true,
      id: paymentLinkResult.id,
      paymentLink: paymentLinkResult.url,
      value: paymentLinkResult.value,
      dueDate: dueDate,
      externalReference: data.externalReference
    };
  } catch (error) {
    console.error("Error creating payment link:", error);
    
    // Get origin for callback URLs
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.treinepass.com.br';
    
    // Try creating a regular payment as fallback
    console.log("Trying to create regular payment as fallback...");
    
    const paymentData: any = {
      customer: customerId, // Usar o ID do cliente que obtivemos (existente ou recém-criado)
      value: data.value,
      description: data.description || "Assinatura de plano",
      dueDate: new Date(new Date().setDate(new Date().getDate() + (data.dueDateLimitDays || 5))).toISOString().split('T')[0],
      externalReference: data.externalReference,
      // URLs de redirecionamento para o fallback
      callbackUrl: data.callbackUrl,
      successUrl: data.successUrl || `${origin}/payment/success?ref=${data.externalReference || ''}`,
      failureUrl: data.failureUrl || `${origin}/payment/failure?ref=${data.externalReference || ''}`
    };
    
    // Usar paymentMethodCodes em vez de billingTypes (importante para compatibilidade com a API v3)
    paymentData.paymentMethodCodes = ["BOLETO", "CREDIT_CARD", "PIX"];
    
    // Impedir que o Asaas solicite os dados do cliente no checkout
    paymentData.showCustomerData = false;
    
    // Remover campos antigos para evitar conflitos
    if (paymentData.billingType) {
      delete paymentData.billingType;
    }
    if (paymentData.billingTypes) {
      delete paymentData.billingTypes;
    }
    
    console.log(`Creating fallback payment for customer ID: ${customerId}`);
    
    try {
      const paymentResponse = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(`Asaas API error (fallback payment): ${errorData.errors?.[0]?.description || errorData.message || 'Unknown error'}`);
      }
      
      const payment = await paymentResponse.json();
      
      // Return payment data in place of payment link
      return {
        success: true,
        payment: payment,
        id: payment.id,
        value: payment.value,
        dueDate: payment.dueDate,
        paymentLink: payment.invoiceUrl, // Use invoiceUrl as paymentLink
        externalReference: data.externalReference
      };
    } catch (paymentError) {
      console.error("Error creating fallback payment:", paymentError);
      throw new Error(`Failed to create payment: ${paymentError.message}`);
    }
  }
}
