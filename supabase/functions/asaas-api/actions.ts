
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

// Novo manipulador para testar a chave API
async function testApiKey(apiKey: string, baseUrl: string) {
  try {
    // Fazer uma requisição simples para verificar se a chave é válida
    // Usamos o endpoint de status que não exige parâmetros adicionais
    const response = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      // Limitar a 1 resultado para minimizar dados retornados
      // A ideia é apenas verificar se a autenticação funciona
      params: {
        limit: 1
      }
    });
    
    // Se a resposta for 401, a chave é inválida
    if (response.status === 401) {
      return { 
        success: false, 
        message: "Chave API inválida ou não autorizada" 
      };
    }
    
    // Se não for 2xx, algum outro erro ocorreu
    if (!response.ok) {
      return { 
        success: false, 
        message: `Erro ao testar API: ${response.status} ${response.statusText}` 
      };
    }
    
    // Se chegamos aqui, a chave é válida
    return { 
      success: true, 
      message: "Chave API válida" 
    };
  } catch (error) {
    console.error("Error testing API key:", error);
    return { 
      success: false, 
      message: error.message || "Erro desconhecido ao testar a chave API" 
    };
  }
}

export async function handleAction(action: string, data: any, apiKey: string, baseUrl: string, supabase: any) {
  console.log(`Handling action: ${action} with data:`, JSON.stringify(data, null, 2));
  
  // Usar o SDK para as novas ações, manter compatibilidade com as ações existentes
  switch (action) {
    // Nova ação para testar a chave API
    case 'testApiKey':
      return testApiKey(data.apiKey, data.environment === 'production' 
                       ? 'https://api.asaas.com/v3' 
                       : 'https://api-sandbox.asaas.com/v3');
      
    // Ações originais (para compatibilidade)
    case 'createCustomer':
      return handleCreateCustomer(data, apiKey, baseUrl);
      
    case 'createPayment':
      return handleCreatePayment(data, apiKey, baseUrl);
      
    case 'createSubscription':
      return handleCreateSubscription(data, apiKey, baseUrl);
      
    case 'createCheckout':
    case 'createCheckoutSession':  // Support for both naming conventions
      return handleCreateCheckout(data, apiKey, baseUrl);
      
    case 'initiateCheckout':
      // Implementação direta do checkout de acordo com a documentação do Asaas
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
