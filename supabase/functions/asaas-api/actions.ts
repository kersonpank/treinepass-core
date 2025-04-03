
import { handleCreateCustomer } from "./handlers/customer.ts";
import { handleCreatePayment, handleGetPayment } from "./handlers/payment.ts";
import { handleCreatePaymentLink } from "./handlers/paymentLink.ts";
import { handleCreateSubscription } from "./handlers/subscription.ts";

export async function handleAction(action: string, data: any, apiKey: string, baseUrl: string, supabase: any) {
  let response = {
    success: false
  };

  switch (action) {
    case 'createCustomer': 
      response = await handleCreateCustomer(data, apiKey, baseUrl);
      break;
      
    case 'createPayment':
      response = await handleCreatePayment(data, apiKey, baseUrl);
      break;
      
    case 'createPaymentLink':
      response = await handleCreatePaymentLink(data, apiKey, baseUrl);
      break;
      
    case 'createSubscription':
      response = await handleCreateSubscription(data, apiKey, baseUrl);
      break;
      
    case 'getPayment':
      response = await handleGetPayment(data, apiKey, baseUrl);
      break;
      
    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  return response;
}
