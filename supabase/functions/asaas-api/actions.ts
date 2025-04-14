
import { handleCreateCheckoutSession } from "./handlers/checkoutSession.ts";
import { handleCreateCustomer } from "./handlers/customer.ts";
import { handleCreatePayment } from "./handlers/payment.ts";
import { handleCreatePaymentLink } from "./handlers/paymentLink.ts";
import { handleCreateSubscription } from "./handlers/subscription.ts";

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
    
    case "createPayment":
      return await handleCreatePayment(data, apiKey, baseUrl);
    
    case "createPaymentLink":
      return await handleCreatePaymentLink(data, apiKey, baseUrl);
    
    case "createSubscription":
      return await handleCreateSubscription(data, apiKey, baseUrl);
    
    case "createCheckoutSession":
      return await handleCreateCheckoutSession(data, apiKey, baseUrl);
    
    default:
      throw new Error(`Action not supported: ${action}`);
  }
}
