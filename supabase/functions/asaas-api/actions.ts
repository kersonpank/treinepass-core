// Consolidando todas as funções em um único arquivo para evitar problemas de importação no deploy

/**
 * Processa pagamentos com cartão de crédito
 */
async function handleCreditCardPayment(data: any, apiKey: string, baseUrl: string) {
  console.log("Processing credit card payment", data);
  
  // Validate required data
  if (!data.creditCard || !data.customer || !data.value) {
    throw new Error("Credit card, customer and payment value are required");
  }
  
  try {
    // Create payment with credit card
    const paymentData = {
      customer: data.customer,
      billingType: "CREDIT_CARD",
      value: data.value,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      description: data.description || "Assinatura TreinePass",
      externalReference: data.externalReference,
      creditCard: data.creditCard,
      creditCardHolderInfo: data.creditCardHolderInfo
    };
    
    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Unknown error');
    }

    return {
      success: true,
      payment: responseData
    };
  } catch (error) {
    console.error('Error processing credit card payment:', error);
    return {
      success: false,
      message: `Error processing credit card payment: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Cria um cliente no Asaas
 */
async function handleCreateCustomer(data: any, apiKey: string, baseUrl: string) {
  return await createCustomer(data, apiKey, baseUrl);
}

/**
 * Cria um pagamento no Asaas
 */
async function handleCreatePayment(data: any, apiKey: string, baseUrl: string) {
  try {
    const paymentData = {
      customer: data.customer,
      billingType: data.billingType || "BOLETO",
      value: data.value,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      description: data.description || "Pagamento TreinePass",
      externalReference: data.externalReference
    };
    
    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Unknown error');
    }

    return {
      success: true,
      payment: responseData
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      message: `Error creating payment: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Cria um link de pagamento no Asaas
 */
async function handleCreatePaymentLink(data: any, apiKey: string, baseUrl: string) {
  try {
    // Preparar dados do link de pagamento
    const paymentLinkData = {
      ...data,
      // Garantir que paymentMethodCodes está presente (API v3 do Asaas)
      paymentMethodCodes: data.paymentMethodCodes || ["BOLETO", "CREDIT_CARD", "PIX"]
    };
    
    // Fazer requisição à API do Asaas
    const response = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentLinkData)
    });
    
    // Processar resposta
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Unknown error');
    }

    return {
      success: true,
      id: responseData.id,
      paymentLink: responseData.url,
      value: responseData.value,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error creating payment link:', error);
    return {
      success: false,
      message: `Error creating payment link: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Cria uma assinatura no Asaas
 */
async function handleCreateSubscription(data: any, apiKey: string, baseUrl: string) {
  try {
    const subscriptionData = {
      customer: data.customer,
      billingType: data.billingType || "CREDIT_CARD",
      value: data.value,
      nextDueDate: data.nextDueDate || new Date().toISOString().split('T')[0],
      cycle: data.cycle || "MONTHLY",
      description: data.description || "Assinatura TreinePass",
      externalReference: data.externalReference
    };
    
    const response = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(subscriptionData)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Unknown error');
    }

    return {
      success: true,
      subscription: responseData
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return {
      success: false,
      message: `Error creating subscription: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Cria uma sessão de checkout no Asaas
 */
async function handleCreateCheckoutSession(data: any, apiKey: string, baseUrl: string) {
  try {
    console.log('Criando sessão de checkout com dados:', JSON.stringify(data, null, 2));
    
    // Validar dados necessários
    if (!data.value && !data.paymentLink) {
      throw new Error('Payment value or payment link ID is required');
    }
    
    // Preparar dados da sessão de checkout
    const checkoutData: Record<string, any> = {
      paymentMethodCodes: data.paymentMethodCodes || ["CREDIT_CARD", "PIX"],
      chargeTypes: data.chargeTypes || ["DETACHED"],
      minutesToExpire: data.minutesToExpire || 60,
      // Muito importante: incluir callback para redirecionar o usuário após o pagamento
      callback: data.callback || {
        successUrl: "https://app.treinepass.com.br/payment/success",
        failureUrl: "https://app.treinepass.com.br/payment/failure"
      }
    };
    
    // Garantir que o callback está presente e no formato correto
    if (!checkoutData.callback || !checkoutData.callback.successUrl || !checkoutData.callback.failureUrl) {
      console.log('Callback inválido ou incompleto, usando valores padrão');
      checkoutData.callback = {
        successUrl: "https://app.treinepass.com.br/payment/success",
        failureUrl: "https://app.treinepass.com.br/payment/failure"
      };
    }
    
    // Adicionar valor se fornecido diretamente
    if (data.value) {
      checkoutData.value = data.value;
    }
    
    // Adicionar dados do cliente se fornecidos
    if (data.customerData) {
      checkoutData.customerData = {
        name: data.customerData.name,
        email: data.customerData.email,
        phone: data.customerData.phone,
        cpfCnpj: data.customerData.cpfCnpj,
        postalCode: data.customerData.postalCode || "01310930"
      };
    }
    
    // Adicionar ID do link de pagamento se fornecido
    if (data.paymentLink) {
      checkoutData.paymentLink = data.paymentLink;
    }
    
    // Adicionar outros campos se fornecidos
    if (data.description) checkoutData.description = data.description;
    if (data.externalReference) checkoutData.externalReference = data.externalReference;
    if (data.billingType) checkoutData.billingType = data.billingType;
    if (data.installmentCount) checkoutData.installmentCount = data.installmentCount;
    if (data.installmentValue) checkoutData.installmentValue = data.installmentValue;
    if (data.preencherDados) checkoutData.preencherDados = data.preencherDados;

    console.log("Creating checkout session with data:", JSON.stringify(checkoutData, null, 2));
    
    // Fazer requisição à API do Asaas
    const response = await fetch(`${baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(checkoutData)
    });
    
    // Processar resposta
    const responseData = await response.json();
    console.log("Checkout session response:", responseData);
    
    if (!response.ok) {
      console.error("Erro na criação da sessão de checkout:", responseData);
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Erro desconhecido');
    }

    return {
      success: true,
      id: responseData.id,
      checkoutUrl: responseData.checkoutUrl,
      value: data.value,
      planName: data.description || "Assinatura TreinePass",
      planPrice: data.value,
      externalReference: data.externalReference
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      message: `Error creating checkout session: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Fluxo integrado de pagamento (cliente + link de pagamento)
 */
async function handleIntegratedPayment(data: any, apiKey: string, baseUrl: string) {
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
    const origin = 'https://app.treinepass.com.br';
    
    // Preparar dados do link de pagamento
    const paymentLinkData = {
      customer: customerId, // Usar o ID do cliente criado/encontrado
      paymentMethodCodes: ["BOLETO", "CREDIT_CARD", "PIX"], // Permitir todos os métodos de pagamento
      value: data.value,
      name: data.name || "Pagamento TreinePass",
      description: data.description || "Assinatura de plano", 
      dueDateLimitDays: data.dueDateLimitDays || 5,
      maxInstallmentCount: data.maxInstallmentCount || 12,
      chargeType: data.chargeType || "DETACHED",
      externalReference: data.externalReference,
      notificationEnabled: true,
      // URLs de redirecionamento após pagamento
      callback: {
        successUrl: data.successUrl || `${origin}/payment/success?ref=${data.externalReference || ''}`,
        failureUrl: data.failureUrl || `${origin}/payment/failure?ref=${data.externalReference || ''}`
      }
    };
    
    console.log("Payment link request:", paymentLinkData);
    
    // Fazer requisição à API do Asaas
    const response = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
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

/**
 * Processa webhooks de notificação do Asaas
 */
async function handleWebhook(data: any, apiKey: string, baseUrl: string, supabase: any) {
  try {
    console.log("Processing webhook:", data);
    
    // Validar se é um evento relacionado a pagamento
    if (!data.event || !data.payment) {
      console.log("Webhook não contém dados de pagamento válidos");
      return { success: true, message: 'No payment data to process' };
    }
    
    // Extrair informações relevantes do webhook
    const { event, payment } = data;
    const externalReference = payment.externalReference;
    const paymentId = payment.id;
    const status = payment.status;
    const value = payment.value;
    
    console.log(`Webhook event: ${event} | Payment ID: ${paymentId} | Status: ${status}`);
    
    // Verificar se há uma referência externa para atualizar no banco
    if (!externalReference) {
      console.log("Sem referência externa para processar");
      return { success: true, message: 'No external reference to process' };
    }
    
    // Mapear status do Asaas para status no nosso sistema
    let subscriptionStatus: string = 'pending';
    let paymentDate: string | null = null;
    
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
      case 'RECEIVED_IN_CASH':
        subscriptionStatus = 'active';
        paymentDate = new Date().toISOString();
        break;
      case 'PENDING':
        subscriptionStatus = 'pending';
        break;
      case 'REFUNDED':
      case 'REFUND_REQUESTED':
      case 'CHARGEBACK_REQUESTED':
      case 'CHARGEBACK_DISPUTE':
      case 'AWAITING_CHARGEBACK_REVERSAL':
        subscriptionStatus = 'refunded';
        break;
      case 'OVERDUE':
        subscriptionStatus = 'overdue';
        break;
      case 'EXPIRED':
        subscriptionStatus = 'expired';
        break;
      case 'CANCELLED':
        subscriptionStatus = 'cancelled';
        break;
      default:
        console.log(`Status desconhecido: ${status}`);
        break;
    }
    
    console.log(`Atualizando assinatura com ref ${externalReference} para status: ${subscriptionStatus}`);
    
    // Atualizar status da assinatura no banco de dados
    const updateData: Record<string, any> = {
      status: subscriptionStatus,
      updated_at: new Date().toISOString()
    };
    
    // Adicionar data de pagamento se confirmado
    if (paymentDate) {
      updateData.payment_date = paymentDate;
    }
    
    // Atualizar no banco de dados
    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('external_reference', externalReference)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar assinatura:", error);
      return { success: false, message: `Erro ao atualizar assinatura: ${error.message}` };
    }
    
    return {
      success: true,
      subscription: updatedSubscription,
      status: subscriptionStatus,
      message: `Assinatura atualizada com sucesso para ${subscriptionStatus}`
    };
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return { success: false, message: `Erro ao processar webhook: ${error.message || 'Erro desconhecido'}` };
  }
}

// Importando diretamente as funu00e7u00f5es de gerenciamento de cliente
// para evitar problemas com a importau00e7u00e3o do arquivo customerManagement.ts
const findCustomerByCpfCnpj = async (cpfCnpj, apiKey, baseUrl) => {
  try {
    // Verificar se cpfCnpj existe
    if (!cpfCnpj) {
      console.error('CPF/CNPJ is undefined or null');
      return {
        success: false,
        message: 'CPF/CNPJ is required'
      };
    }
    
    // Format CPF/CNPJ - remove non-numeric characters
    const formattedCpfCnpj = String(cpfCnpj).replace(/[^\d]/g, '');
    
    console.log(`Searching for customer with CPF/CNPJ: ${formattedCpfCnpj}`);
    
    // Search for customer by CPF/CNPJ
    const response = await fetch(`${baseUrl}/customers?cpfCnpj=${formattedCpfCnpj}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });

    const responseData = await response.json();

    if (response.ok && responseData.data && responseData.data.length > 0) {
      // Return the first customer found
      return {
        success: true,
        customer: responseData.data[0]
      };
    }

    return {
      success: false,
      message: 'Customer not found'
    };
  } catch (error) {
    console.error('Error finding customer:', error);
    return {
      success: false,
      message: `Error finding customer: ${error.message || 'Unknown error'}`
    };
  }
};

const createCustomer = async (customerData, apiKey, baseUrl) => {
  try {
    console.log(`Creating new customer:`, customerData);
    
    // Verificar se customerData existe e tem os campos necessários
    if (!customerData || !customerData.cpfCnpj) {
      console.error('Customer data is invalid:', customerData);
      return {
        success: false,
        message: 'Invalid customer data: CPF/CNPJ is required'
      };
    }
    
    // Format CPF/CNPJ - remove non-numeric characters
    const formattedCpfCnpj = String(customerData.cpfCnpj).replace(/[^\d]/g, '');
    
    // Format phone numbers - remove non-numeric characters
    let phone = customerData.phone || customerData.phone_number;
    if (phone) {
      phone = String(phone).replace(/[^\d]/g, '');
    }
    
    // Format postal code - remove non-numeric characters
    let postalCode = customerData.postalCode;
    if (postalCode) {
      postalCode = String(postalCode).replace(/[^\d]/g, '');
      // Ensure it's a valid postal code
      if (!postalCode || postalCode.length !== 8 || postalCode === "00000000") {
        postalCode = "01310930"; // Default to a valid postal code (Av. Paulista, SP)
      }
    } else {
      postalCode = "01310930"; // Default to a valid postal code if not provided
    }
    
    // Prepare customer data with formatted values
    const formattedCustomerData = {
      ...customerData,
      cpfCnpj: formattedCpfCnpj,
      phone: phone,
      postalCode: postalCode
    };
    
    // Create customer in Asaas
    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(formattedCustomerData)
    });

    const responseData = await response.json();
    console.log(`Customer creation response:`, responseData);

    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Unknown error');
    }

    return {
      success: true,
      customer: responseData
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      success: false,
      message: `Error creating customer: ${error.message || 'Unknown error'}`
    };
  }
};

const findOrCreateCustomer = async (customerData, apiKey, baseUrl) => {
  try {
    // Verificar se customerData existe e tem os campos necessários
    if (!customerData) {
      console.error('Customer data is undefined or null');
      return {
        success: false,
        message: 'Customer data is required'
      };
    }
    
    // Garantir que temos um CPF/CNPJ para buscar o cliente
    let cpfCnpj = customerData.cpfCnpj;
    
    // Se não tiver cpfCnpj, verificar se tem cpf (formato do TreinePass)
    if (!cpfCnpj && customerData.cpf) {
      cpfCnpj = customerData.cpf;
      console.log(`Usando CPF do perfil: ${cpfCnpj}`);
    }
    
    // Se ainda não tiver, usar um CPF genérico
    if (!cpfCnpj) {
      cpfCnpj = '12345678909';
      console.log(`Usando CPF genérico: ${cpfCnpj}`);
    }
    
    // Formatar o CPF/CNPJ (remover caracteres não numéricos)
    cpfCnpj = String(cpfCnpj).replace(/[^\d]/g, '');
    
    // First, try to find the customer by CPF/CNPJ
    const findResult = await findCustomerByCpfCnpj(cpfCnpj, apiKey, baseUrl);
    
    if (findResult.success) {
      console.log(`Customer found:`, findResult.customer);
      return {
        success: true,
        customer: findResult.customer,
        isNew: false
      };
    }
    
    // Preparar dados para criar um novo cliente
    const customerPayload = {
      name: customerData.name || customerData.full_name || 'Cliente TreinePass',
      cpfCnpj: cpfCnpj,
      email: customerData.email || 'cliente@treinepass.com.br',
      phone: customerData.phone || customerData.phone_number || '11999999999',
      postalCode: customerData.postalCode || '01310930'
    };
    
    // If customer not found, create a new one
    const createResult = await createCustomer(customerPayload, apiKey, baseUrl);
    
    if (createResult.success) {
      return {
        success: true,
        customer: createResult.customer,
        isNew: true
      };
    }
    
    return {
      success: false,
      message: createResult.message
    };
  } catch (error) {
    console.error('Error in find or create customer:', error);
    return {
      success: false,
      message: `Error in find or create customer: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Handle simplified payment flow with customer creation and payment link
 */
async function handleSimplifiedPayment(data: any, apiKey: string, baseUrl: string) {
  console.log("Processing simplified payment flow", data);
  
  // Validate required data
  if (!data.customerData || !data.value) {
    throw new Error("Customer data and payment value are required");
  }
  
  // Step 1: Find or create customer
  const customerResult = await findOrCreateCustomer(data.customerData, apiKey, baseUrl);
  if (!customerResult.success) {
    throw new Error(`Failed to process customer: ${customerResult.message}`);
  }
  
  const customerId = customerResult.customer.id;
  console.log(`Using customer ID: ${customerId}`);
  
  // Step 2: Create payment link
  const paymentLinkData = {
    customer: customerId,
    value: data.value,
    name: data.name || "Assinatura TreinePass",
    description: data.description || "Assinatura de plano TreinePass",
    externalReference: data.externalReference,
    successUrl: data.successUrl,
    failureUrl: data.failureUrl
  };
  
  const paymentResult = await handleCreatePaymentLink(paymentLinkData, apiKey, baseUrl);
  
  // Return combined result
  return {
    success: true,
    customer: customerResult.customer,
    isNewCustomer: customerResult.isNew,
    paymentLink: paymentResult.paymentLink,
    paymentId: paymentResult.id,
    value: paymentResult.value,
    dueDate: paymentResult.dueDate,
    externalReference: data.externalReference
  };
}

export async function handleAction(
  action: string,
  data: any,
  apiKey: string,
  baseUrl: string,
  supabase: any
) {
  console.log(`Handling action: ${action}`);
  
  switch (action) {
    case "createCustomer":
      return await handleCreateCustomer(data, apiKey, baseUrl);
    
    case "findCustomer":
      return await findCustomerByCpfCnpj(data.cpfCnpj, apiKey, baseUrl);
      
    case "findOrCreateCustomer":
      return await findOrCreateCustomer(data.customerData, apiKey, baseUrl);
      
    case "processCreditCardPayment":
      return await handleCreditCardPayment(data, apiKey, baseUrl);
    
    case "createPayment":
      return await handleCreatePayment(data, apiKey, baseUrl);
    
    case "createPaymentLink":
      // Garantir que os parâmetros importantes estão presentes
      const paymentLinkData = {
        ...data,
        showCustomerData: false
      };
      
      // Remover campos antigos se existirem
      if ('billingType' in paymentLinkData) {
        delete paymentLinkData.billingType;
      }
      if ('billingTypes' in paymentLinkData) {
        delete paymentLinkData.billingTypes;
      }
      
      // Garantir que paymentMethodCodes está presente (API v3 do Asaas)
      if (!paymentLinkData.paymentMethodCodes) {
        paymentLinkData.paymentMethodCodes = ["BOLETO", "CREDIT_CARD", "PIX"];
      }
      
      console.log("Processing createPaymentLink with data:", JSON.stringify(paymentLinkData, null, 2));
      return await handleCreatePaymentLink(paymentLinkData, apiKey, baseUrl);
    
    case "createSubscription":
      return await handleCreateSubscription(data, apiKey, baseUrl);
    
    case "createCheckoutSession":
      // Garantir que o campo callback obrigatório está presente
      if (!data.callback) {
        data.callback = {
          successUrl: "https://app.treinepass.com.br/payment/success",
          failureUrl: "https://app.treinepass.com.br/payment/failure"
        };
      }
      return await handleCreateCheckoutSession(data, apiKey, baseUrl);
      
    case "simplifiedPayment":
      return await handleSimplifiedPayment(data, apiKey, baseUrl);
    
    case "integratedPayment":
      return await handleIntegratedPayment(data, apiKey, baseUrl);
      
    case "webhook":
      return await handleWebhook(data, apiKey, baseUrl, supabase);
    
    case "initiateCheckout":
      // Unifica fluxo entre PIX e Cartão
      const { planId, customerData, paymentMethod, externalReference } = data;
      // Usar dados do plano fornecidos diretamente ou buscar do banco
      let planPrice, planName;
      if (data.planData && data.planData.price && data.planData.name) {
        planPrice = data.planData.price;
        planName = data.planData.name;
        console.log("Usando dados do plano fornecidos diretamente:", planPrice, planName);
      } else {
        // Buscar preço e nome do plano do banco
        const { data: plan, error: planError } = await supabase
          .from("plans").select("price, name").eq("id", planId).single();
        if (planError || !plan) throw new Error("Plano não encontrado");
        planPrice = plan.price;
        planName = plan.name;
      }
      
    // Verificar se temos os callbacks
    const callback = data.callback || {
      successUrl: "https://app.treinepass.com.br/payment/success",
      failureUrl: "https://app.treinepass.com.br/payment/failure"
    };
      
    // Gerar externalReference se não fornecido
    const extRef = externalReference || crypto.randomUUID();
    let result;
      
    // Apenas para pagamento PIX precisamos criar/buscar o cliente
    let custId;
    if (paymentMethod === "PIX") {
      // Criar ou recuperar customer Asaas apenas para PIX
      const custRes = await findOrCreateCustomer(customerData, apiKey, baseUrl);
      if (!custRes.success) throw new Error(`Erro ao criar cliente: ${custRes.message}`);
      custId = custRes.customer.id;
    }
      
    if (paymentMethod === "PIX") {
      // Criar pagamento PIX diretamente usando a API de pagamentos
      const paymentData = {
        customer: custId,
        billingType: "PIX",
        value: planPrice,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
        description: `Assinatura ${planName}`,
        externalReference: extRef
      };
          value: planPrice,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
          description: `Assinatura ${planName}`,
          externalReference: extRef
        };
        
        // Fazer requisição direta à API do Asaas
        const paymentResponse = await fetch(`${baseUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          },
          body: JSON.stringify(paymentData)
        });
        
        const paymentResult = await paymentResponse.json();
        if (!paymentResponse.ok) {
          throw new Error(`Erro na API do Asaas: ${paymentResult.errors?.[0]?.description || 'Erro desconhecido'}`);
        }
        
        // Definir tempo de expiração mais curto para o PIX (30 minutos a partir de agora)
        const pixExpirationDate = new Date();
        pixExpirationDate.setMinutes(pixExpirationDate.getMinutes() + 30);
        const formattedExpirationDate = pixExpirationDate.toISOString();
        
        // Obter o código PIX e QR code
        const pixResponse = await fetch(`${baseUrl}/payments/${paymentResult.id}/pixQrCode`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          }
        });
        
        const pixResult = await pixResponse.json();
        console.log("PIX QR Code response:", pixResult);
        
        // Criar resultado com dados do PIX
        result = {
          success: true,
          id: paymentResult.id,
          paymentLink: paymentResult.invoiceUrl,
          value: paymentResult.value,
          dueDate: paymentResult.dueDate,
          pixQrCode: pixResult.encodedImage,
          pixCopyPaste: pixResult.payload,
          expirationDate: formattedExpirationDate,
          expiresInMinutes: 30
        };
        
        // Criar registro de assinatura no banco de dados
        try {
          const { data: subscription, error } = await supabase
            .from('subscriptions')
            .insert([
              {
                user_id: customerData.id,
                plan_id: planId,
                payment_id: paymentResult.id,
                external_reference: extRef,
                status: 'pending',
                payment_method: paymentMethod,
                amount: planPrice,
                due_date: paymentResult.dueDate
              }
            ])
            .select()
            .single();
            
          if (error) {
            console.error("Erro ao criar assinatura:", error);
          } else {
            console.log("Assinatura criada com sucesso:", subscription);
            result.subscriptionId = subscription.id;
          }
        } catch (dbError) {
          console.error("Erro ao salvar assinatura no banco:", dbError);
        }
        
      } else if (paymentMethod === "CREDIT_CARD") {
        console.log("Dados do cliente recebidos:", JSON.stringify(customerData, null, 2));
        
        // Cancelar assinaturas pendentes anteriores (conforme memória)
        try {
          const { data: pendingSubscriptions, error } = await supabase
            .from('subscriptions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('user_id', customerData.id)
            .eq('status', 'pending')
            .select();
            
          if (pendingSubscriptions && pendingSubscriptions.length > 0) {
            console.log(`Canceladas ${pendingSubscriptions.length} assinaturas pendentes anteriores`);
          }
        } catch (err) {
          console.error("Erro ao cancelar assinaturas pendentes:", err);
        }
        
        // Preparar dados para o checkout do Asaas
        // Seguindo o fluxo de pagamento conforme a memória:
        // 1. Direcionar o usuário para o pagamento no Asaas
        // 2. Após o pagamento ser validado, o status da assinatura será alterado via webhook
        // 3. Com o status atualizado, as funcionalidades serão liberadas
        const checkoutData = {
          value: planPrice,
          description: `Assinatura ${planName}`,
          externalReference: extRef,
          paymentMethodCodes: ["CREDIT_CARD"],
          chargeTypes: ["DETACHED"], // Para pagamento único
          minutesToExpire: 60,
          callback: callback // URLs de redirecionamento após o pagamento
        };
        
        console.log("Criando checkout para cartão de crédito:", checkoutData);
        
        // Fazer requisição direta à API do Asaas para criar sessão de checkout
        try {
          console.log(`Fazendo requisição para ${baseUrl}/checkout/sessions`);
          
          const response = await fetch(`${baseUrl}/checkout/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            },
            body: JSON.stringify(checkoutData)
          });
          
          const responseText = await response.text();
          console.log(`Resposta bruta da API: ${responseText}`);
          
          let responseData;
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            console.error('Erro ao fazer parse da resposta JSON:', e);
            throw new Error(`Resposta inválida da API: ${responseText}`);
          }
          
          console.log("Resposta da API do Asaas:", responseData);
          
          if (!response.ok) {
            throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Erro desconhecido');
          }
          
          if (!responseData.checkoutUrl) {
            console.error('Resposta sem URL de checkout:', responseData);
            throw new Error('URL de checkout não recebida do Asaas');
          }
          
          result = {
            success: true,
            id: responseData.id,
            checkoutUrl: responseData.checkoutUrl,
            value: planPrice,
            planName: planName,
            planPrice: planPrice,
            externalReference: extRef
          };
          
          console.log('Resultado final:', result);
        } catch (error) {
          console.error("Erro ao criar sessão de checkout:", error);
          throw new Error(`Erro ao criar sessão de checkout: ${error.message}`);
        }
        
        // Criar registro de assinatura no banco de dados
        try {
          const { data: subscription, error } = await supabase
            .from('subscriptions')
            .insert([
              {
                user_id: customerData.id,
                plan_id: planId,
                payment_id: result.id,
                external_reference: extRef,
                status: 'pending',
                payment_method: paymentMethod,
                amount: planPrice,
                due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0]
              }
            ])
            .select()
            .single();
            
          if (error) {
            console.error("Erro ao criar assinatura:", error);
          } else {
            console.log("Assinatura criada com sucesso:", subscription);
            result.subscriptionId = subscription.id;
          }
        } catch (dbError) {
          console.error("Erro ao salvar assinatura no banco:", dbError);
        }
      } else {
        throw new Error(`Método de pagamento inválido: ${paymentMethod}`);
      }
      
      return { ...result, externalReference: extRef };
    
    default:
      throw new Error(`Action not supported: ${action}`);
  }
}
