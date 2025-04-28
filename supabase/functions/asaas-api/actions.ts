
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
    // Verificar se a chave API tem formato válido
    if (!apiKey || apiKey.length < 20) {
      return { 
        success: false, 
        message: "Formato de chave API inválido. Verifique se você está usando a chave correta." 
      };
    }
    
    console.log(`Testando chave API no ambiente ${baseUrl}`);
    
    // Fazer uma requisição simples para verificar se a chave é válida
    const response = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      }
    });
    
    // Log da resposta para debug
    const responseStatus = response.status;
    const responseBody = await response.text();
    console.log(`Resposta do teste de API: Status ${responseStatus}, Body: ${responseBody}`);
    
    // Se a resposta for 401, a chave é inválida
    if (response.status === 401) {
      return { 
        success: false, 
        message: "Chave API inválida ou não autorizada. Verifique se você está usando a chave correta e que ela tem permissões adequadas." 
      };
    }
    
    // Se não for 2xx, algum outro erro ocorreu
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseBody);
        return { 
          success: false, 
          message: `Erro ao testar API: ${response.status} - ${errorData?.errors?.[0]?.description || errorData?.message || 'Erro desconhecido'}` 
        };
      } catch (e) {
        return {
          success: false,
          message: `Erro ao testar API: ${response.status} ${response.statusText}`
        };
      }
    }
    
    // Se chegamos aqui, a chave é válida
    return { 
      success: true, 
      message: "Chave API válida! Conexão com a API do Asaas estabelecida com sucesso." 
    };
  } catch (error) {
    console.error("Error testing API key:", error);
    return { 
      success: false, 
      message: error.message || "Erro desconhecido ao testar a chave API",
      details: { error: error.toString(), stack: error.stack }
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
