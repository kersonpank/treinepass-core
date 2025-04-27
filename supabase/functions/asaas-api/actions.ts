
// Imports dos manipuladores originais
import { handleCreateCustomer } from './handlers/customer.ts';
import { handleCreatePayment } from './handlers/payment.ts';
import { handleCreateSubscription } from './handlers/subscription.ts';
import { handleCreateCheckout } from './handlers/checkoutSession.ts';
import { handleCreditCardPayment } from './handlers/creditCardPayment.ts';
import { createDirectCheckout } from './checkout-direct.ts';

// Imports dos novos manipuladores com SDK
import { createCustomer } from './handlers/sdk-customer.ts';
import { createPayment } from './handlers/sdk-payment.ts';
import { createPaymentLink } from './handlers/sdk-payment-link.ts';
import { handleWebhook } from './handlers/sdk-webhook.ts';
import { 
  createIntegratedCheckout,
  cancelSubscription,
  checkPaymentStatus,
  processWebhook
} from './sdk-integration.ts';

export async function handleAction(action: string, data: any, apiKey: string, baseUrl: string, supabase: any) {
  console.log(`Handling action: ${action} with data:`, JSON.stringify(data, null, 2));
  
  // Usar o SDK para as novas ações, manter compatibilidade com as ações existentes
  switch (action) {
    // Ações originais (para compatibilidade)
    case 'createCustomer':
      return handleCreateCustomer(data, apiKey, baseUrl);
      
    case 'createPayment':
      return handleCreatePayment(data, apiKey, baseUrl);
      
    case 'createSubscription':
      return handleCreateSubscription(data, apiKey, baseUrl);
      
    case 'createCheckout':
      return handleCreateCheckout(data, apiKey, baseUrl);
      
    case 'initiateCheckout':
      return createDirectCheckout(data, apiKey, baseUrl);
      
    case 'processCreditCard':
      return handleCreditCardPayment(data, apiKey, baseUrl);
    
    // Novas ações com SDK
    case 'sdkCreateCustomer':
      return createCustomer(data, apiKey, baseUrl);
      
    case 'sdkCreatePayment':
      return createPayment(data, apiKey, baseUrl);
      
    case 'sdkCreatePaymentLink':
      return createPaymentLink(data, apiKey, baseUrl);
      
    case 'sdkIntegratedCheckout':
      return createIntegratedCheckout(data, apiKey, baseUrl);
      
    case 'sdkCancelSubscription':
      return cancelSubscription(data.subscriptionId, apiKey, baseUrl);
      
    case 'sdkCheckPaymentStatus':
      return checkPaymentStatus(data.paymentId, apiKey, baseUrl);
      
    case 'webhook':
      return processWebhook(data, apiKey, baseUrl, supabase);
      
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
