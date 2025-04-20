
interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  postalCode?: string;
  province?: string;
  city?: number | string;
}

interface CheckoutSessionData {
  customerData?: CustomerData;
  preencherDados?: boolean; // Flag para indicar se deve preencher os dados do cliente ou deixar o usuário preencher
  billingType?: string; // Tipo de pagamento (singular em vez de plural)
  billingTypes?: string[]; // Mantido para compatibilidade com código existente
  paymentMethodCodes?: string[]; // Novo campo para compatibilidade com a API v3 do Asaas
  chargeTypes: string[];
  value: number;
  description: string;
  externalReference: string;
  minutesToExpire?: number;
  callback?: {
    successUrl?: string;
    failureUrl?: string;
    cancelUrl?: string;
  };
}

/**
 * Prepara os dados do cliente garantindo que todos os campos obrigatórios
 * estejam preenchidos e com valores válidos
 */
function prepareCustomerData(data?: CustomerData): Record<string, any> | null {
  if (!data) return null;
  
  // Verificar dados obrigatórios
  if (!data.name || !data.email || !data.cpfCnpj) {
    console.warn("Missing required customer data fields");
  }
  
  // Formatar CPF/CNPJ - remover caracteres não numéricos
  const cpfCnpj = data.cpfCnpj ? data.cpfCnpj.replace(/[^\d]/g, '') : '';
  
  // Formatar e validar CEP
  let postalCode = data.postalCode || "";
  postalCode = postalCode.replace(/\D/g, '');
  
  // Usar CEP válido padrão se necessário (Av. Paulista, SP)
  if (!postalCode || postalCode.length !== 8 || postalCode === "00000000") {
    postalCode = "01310930";
  }
  
  // Formatar telefone (remover caracteres não numéricos)
  const phone = data.phone ? data.phone.replace(/\D/g, '') : undefined;
  
  // Construir objeto de retorno apenas com campos necessários
  return {
    name: data.name,
    cpfCnpj: cpfCnpj,
    email: data.email,
    phone: phone,
    address: data.address || "Endereço não informado",
    addressNumber: data.addressNumber || "S/N",
    province: data.province || "Centro",
    postalCode: postalCode,
    ...(data.complement ? { complement: data.complement } : {}),
    ...(data.city ? { city: data.city } : {})
  };
}

/**
 * Cria uma sessão de checkout no Asaas com validação de dados melhorada
 */
export async function handleCreateCheckoutSession(data: CheckoutSessionData, apiKey: string, baseUrl: string) {
  console.log(`Creating checkout session with data:`, JSON.stringify(data, null, 2));
  
  try {
    // Validar dados mínimos necessários
    if (!data.externalReference) {
      throw new Error("externalReference is required");
    }
    
    // Verificar se temos pelo menos um método de pagamento definido
    if ((!data.billingType) && (!data.billingTypes || data.billingTypes.length === 0) && (!data.paymentMethodCodes || data.paymentMethodCodes.length === 0)) {
      throw new Error("At least one payment method is required");
    }
    
    if (!data.value || data.value <= 0) {
      throw new Error("value must be greater than 0");
    }
    
    // Processar dados do cliente com validação melhorada
    let customerData;
    if (data.preencherDados && data.customerData) {
      customerData = prepareCustomerData(data.customerData);
      
      // Garantir que o CEP seja válido (o Asaas rejeita CEPs inválidos como 00000000)
      if (!customerData.postalCode || customerData.postalCode === '00000000') {
        customerData.postalCode = '01310930'; // CEP válido da Av. Paulista como fallback
      }
      
      // Garantir que temos um endereço
      if (!customerData.address || customerData.address.trim() === '') {
        customerData.address = 'Endereço não informado';
      }
      
      // Garantir que temos um número
      if (!customerData.addressNumber || customerData.addressNumber.trim() === '') {
        customerData.addressNumber = 'S/N';
      }
      
      // Garantir que temos um bairro
      if (!customerData.province || customerData.province.trim() === '') {
        customerData.province = 'Centro';
      }
      
      console.log(`Processed customer data:`, JSON.stringify(customerData, null, 2));
    }
    
    // Construir payload para o checkout
    const checkoutData: Record<string, any> = {
      // Usar paymentMethodCodes para compatibilidade com a API v3 do Asaas
      paymentMethodCodes: data.paymentMethodCodes || data.billingTypes || [data.billingType || "BOLETO"],
      chargeTypes: data.chargeTypes || ["DETACHED"],
      minutesToExpire: data.minutesToExpire || 60,
      items: [{
        name: data.description || `Assinatura ${data.externalReference}`,
        value: data.value,
        quantity: 1
      }],
      externalReference: data.externalReference
    };
    
    // Adicionar URLs de callback se fornecidas
    if (data.callback) {
      checkoutData.callback = {};
      
      // Garantir que as URLs de callback são absolutas e bem formadas
      const ensureValidUrl = (url?: string): string | undefined => {
        if (!url) return undefined;
        
        try {
          // Verificar se a URL é válida
          new URL(url);
          return url;
        } catch (e) {
          // Se não for uma URL válida, tentar adicionar o protocolo
          if (!url.startsWith('http')) {
            try {
              new URL(`https://${url}`);
              return `https://${url}`;
            } catch (e2) {
              console.warn(`Invalid callback URL: ${url}`);
              return undefined;
            }
          }
          console.warn(`Invalid callback URL: ${url}`);
          return undefined;
        }
      };
      
      // Aplicar validação às URLs
      const validSuccessUrl = ensureValidUrl(data.callback.successUrl);
      const validFailureUrl = ensureValidUrl(data.callback.failureUrl);
      const validCancelUrl = ensureValidUrl(data.callback.cancelUrl);
      
      // Usar URLs válidas ou fallbacks
      if (validSuccessUrl) {
        checkoutData.callback.successUrl = validSuccessUrl;
      }
      
      if (validFailureUrl) {
        checkoutData.callback.failureUrl = validFailureUrl;
      }
      
      // Para cancelUrl, usar cancelUrl válida ou failureUrl como fallback
      if (validCancelUrl || validFailureUrl) {
        checkoutData.callback.cancelUrl = validCancelUrl || validFailureUrl;
      }
      
      // Se não temos nenhuma URL válida, não enviar o objeto callback
      if (Object.keys(checkoutData.callback).length === 0) {
        delete checkoutData.callback;
      }
    }
    
    // Adicionar dados do cliente se disponíveis
    if (customerData) {
      checkoutData.customerData = customerData;
    }

    // Garantir que paymentMethodCodes esteja presente no payload
    if (!checkoutData.paymentMethodCodes) {
      checkoutData.paymentMethodCodes = ["BOLETO", "CREDIT_CARD", "PIX"];
    }
    
    // Remover campos antigos para evitar conflitos
    if (checkoutData.billingType) {
      delete checkoutData.billingType;
    }
    if (checkoutData.billingTypes) {
      delete checkoutData.billingTypes;
    }
    
    // Criar uma cópia do objeto para garantir que nenhum middleware remova campos
    const finalPayload = JSON.stringify({
      ...checkoutData,
      paymentMethodCodes: checkoutData.paymentMethodCodes // Garantir que este campo esteja presente
    });
    
    console.log(`Sending checkout request to Asaas:`, finalPayload);

    // Fazer requisição à API do Asaas
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: finalPayload
    });

    // Obter resposta como texto para logging
    const responseText = await response.text();
    console.log(`Asaas checkout response status: ${response.status}, body:`, responseText);

    // Analisar resposta
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("Error parsing Asaas response:", parseError);
      result = { error: "Invalid response format" };
    }

    if (!response.ok) {
      console.error(`Asaas API error:`, result);
      throw new Error(`Asaas API error: ${result.errors?.[0]?.description || result.message || 'Unknown error'}`);
    }

    // Determinar a URL correta para o checkout
    // Em produção, usar a URL correta baseada no ambiente
    const isProduction = baseUrl.includes('asaas.com') && !baseUrl.includes('sandbox');
    const checkoutBaseUrl = isProduction ? 'https://www.asaas.com' : 'https://sandbox.asaas.com';
    
    return {
      success: true,
      checkoutUrl: `${checkoutBaseUrl}/checkoutSession/${result.id}`,
      ...result
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}
