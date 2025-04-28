
import { findOrCreateCustomer } from "./handlers/sdk-customer.ts";

interface CustomerData {
  name: string;
  email?: string;
  cpfCnpj: string;
  mobilePhone?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

interface PaymentData {
  description: string;
  value: number;
  externalReference?: string;
  dueDateLimitDays?: number;
}

interface CheckoutConfig {
  billingTypes?: string[];
  paymentMethodCodes?: string[];
  callbackUrl?: string;
  successUrl?: string;
  failureUrl?: string;
}

export async function createIntegratedCheckout(data: {
  customerData: CustomerData;
  paymentData: PaymentData;
  config?: CheckoutConfig;
}, apiKey: string, baseUrl: string) {
  try {
    console.log("Iniciando checkout integrado com Asaas:", data);
    
    // Create or find the customer
    const customer = await findOrCreateCustomer(data.customerData, apiKey, baseUrl);
    
    // Generate payment link / checkout
    const paymentLinkData = {
      customer: customer.id,
      value: data.paymentData.value,
      name: data.paymentData.description,
      description: data.paymentData.description,
      externalReference: data.paymentData.externalReference,
      dueDateLimitDays: data.paymentData.dueDateLimitDays || 7,
      billingType: "UNDEFINED", // User can choose payment method in checkout
      showCustomerData: false,   // Don't ask for customer data again
      paymentMethodCodes: data.config?.billingTypes || ["CREDIT_CARD", "BOLETO", "PIX"],
      successUrl: data.config?.successUrl,
      failureUrl: data.config?.failureUrl,
    };
    
    console.log("Creating payment link with data:", JSON.stringify(paymentLinkData, null, 2));
    
    // Make API request
    const response = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify(paymentLinkData)
    });
    
    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new Error(`Erro na API Asaas (${response.status}): ${errorData?.errors?.[0]?.description || errorData?.message || 'Erro desconhecido'}`);
    }
    
    // Parse response
    const responseText = await response.text();
    if (!responseText) {
      throw new Error("Resposta vazia da API Asaas");
    }
    
    const paymentLink = JSON.parse(responseText);
    console.log("Payment link created:", JSON.stringify(paymentLink, null, 2));
    
    return {
      success: true,
      paymentId: paymentLink.id,
      paymentLink: paymentLink.url,
      encodedImage: paymentLink.encodedImage,
      payload: paymentLink.payload,
      customer: customer,
      metadata: {
        description: data.paymentData.description,
        value: data.paymentData.value,
        externalReference: data.paymentData.externalReference
      }
    };
  } catch (error) {
    console.error("Erro no checkout integrado:", error);
    return {
      success: false,
      error: {
        message: error.message || "Erro desconhecido",
        details: error
      },
      details: {}
    };
  }
}

export async function cancelSubscription(subscriptionId: string, apiKey: string, baseUrl: string) {
  try {
    // Make API request to cancel subscription
    const response = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      }
    });
    
    // Check for API errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new Error(`API Error (${response.status}): ${errorData?.errors?.[0]?.description || errorData?.message || 'Unknown error'}`);
    }
    
    // Parse response data
    const responseText = await response.text();
    const subscriptionData = JSON.parse(responseText);
    
    return {
      success: true,
      subscription: subscriptionData
    };
    
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return {
      success: false,
      error: {
        message: error.message,
        details: error
      }
    };
  }
}

export async function checkPaymentStatus(paymentId: string, apiKey: string, baseUrl: string) {
  try {
    // Make API request to get payment status
    const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      }
    });
    
    // Check for API errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new Error(`API Error (${response.status}): ${errorData?.errors?.[0]?.description || errorData?.message || 'Unknown error'}`);
    }
    
    // Parse response data
    const responseText = await response.text();
    const paymentData = JSON.parse(responseText);
    
    return {
      success: true,
      payment: paymentData
    };
    
  } catch (error) {
    console.error("Error checking payment status:", error);
    return {
      success: false,
      error: {
        message: error.message,
        details: error
      }
    };
  }
}

export async function processWebhook(webhookData: any, apiKey: string, baseUrl: string, supabase: any) {
  try {
    // Process webhook event
    // Implementation depends on your application logic
    
    // For example, update payment status in your database
    return {
      success: true,
      processed: true,
      event: webhookData.event
    };
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      success: false,
      error: {
        message: error.message,
        details: error
      }
    };
  }
}
