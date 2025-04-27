/**
 * Handler para processamento de pagamentos diretos com cartão de crédito
 * Implementa a integração direta com a API Asaas para pagamentos com cartão
 */

interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface CardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone?: string;
  mobilePhone?: string;
}

interface CreditCardPaymentData {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
  creditCard: CreditCardData;
  creditCardHolderInfo: CardHolderInfo;
  remoteIp?: string;
}

/**
 * Processa um pagamento direto com cartão de crédito
 * Esta função envia os dados do cartão diretamente para o Asaas,
 * permitindo que o pagamento seja feito sem redirecionamento
 */
export async function handleCreditCardPayment(data: any, apiKey: string, baseUrl: string) {
  console.log("Processing direct credit card payment");
  
  // Validar campos obrigatórios
  if (!data.customer) throw new Error("Customer ID is required");
  if (!data.value || data.value <= 0) throw new Error("Valid payment value is required");
  if (!data.creditCard) throw new Error("Credit card data is required");
  if (!data.creditCardHolderInfo) throw new Error("Card holder information is required");
  
  // Preparar dados de pagamento
  const paymentData: CreditCardPaymentData = {
    customer: data.customer,
    billingType: "CREDIT_CARD",
    value: data.value,
    dueDate: data.dueDate || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    description: data.description || "Pagamento com cartão",
    externalReference: data.externalReference || crypto.randomUUID(),
    creditCard: {
      holderName: data.creditCard.holderName,
      number: data.creditCard.number,
      expiryMonth: data.creditCard.expiryMonth,
      expiryYear: data.creditCard.expiryYear,
      ccv: data.creditCard.ccv || data.creditCard.cvv
    },
    creditCardHolderInfo: {
      name: data.creditCardHolderInfo.name,
      email: data.creditCardHolderInfo.email,
      cpfCnpj: data.creditCardHolderInfo.cpfCnpj,
      postalCode: data.creditCardHolderInfo.postalCode || "01310930",
      addressNumber: data.creditCardHolderInfo.addressNumber || "S/N",
      ...(data.creditCardHolderInfo.addressComplement ? { addressComplement: data.creditCardHolderInfo.addressComplement } : {}),
      ...(data.creditCardHolderInfo.phone ? { phone: data.creditCardHolderInfo.phone } : {}),
      ...(data.creditCardHolderInfo.mobilePhone ? { mobilePhone: data.creditCardHolderInfo.mobilePhone } : {})
    },
    ...(data.remoteIp ? { remoteIp: data.remoteIp } : {})
  };
  
  try {
    // Fazer requisição à API do Asaas
    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    });
    
    // Obter resposta como texto para logging
    const responseText = await response.text();
    
    // Evitar logar dados sensíveis do cartão
    const logSafeData = { ...paymentData };
    if (logSafeData.creditCard) {
      logSafeData.creditCard = {
        ...logSafeData.creditCard,
        number: `****${logSafeData.creditCard.number.slice(-4)}`,
        ccv: '***'
      };
    }
    
    console.log(`Request sent to Asaas: ${JSON.stringify(logSafeData)}`);
    console.log(`Asaas payment response status: ${response.status}`);
    
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
    
    return {
      success: true,
      payment: result,
      status: result.status,
      id: result.id,
      value: result.value,
      netValue: result.netValue,
      paymentDate: result.paymentDate,
      dueDate: result.dueDate,
      invoiceUrl: result.invoiceUrl,
      externalReference: result.externalReference
    };
  } catch (error) {
    console.error("Error processing credit card payment:", error);
    throw error;
  }
}
