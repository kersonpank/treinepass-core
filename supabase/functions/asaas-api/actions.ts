
import { handleCreateCustomer } from './handlers/customerManagement.ts';
import { handleCreatePayment } from './handlers/payment.ts';
import { handleCreateSubscription } from './handlers/subscription.ts';
import { handleCreateCheckout } from './handlers/checkoutSession.ts';

export async function handleAction(action: string, data: any, apiKey: string, baseUrl: string, supabase: any) {
  console.log(`Handling action: ${action}`);
  
  switch (action) {
    case 'createCustomer':
      return handleCreateCustomer(data, apiKey, baseUrl);
      
    case 'createPayment':
      return handleCreatePayment(data, apiKey, baseUrl);
      
    case 'createSubscription':
      return handleCreateSubscription(data, apiKey, baseUrl);
      
    case 'createCheckout':
      return handleCreateCheckout(data, apiKey, baseUrl);
      
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
