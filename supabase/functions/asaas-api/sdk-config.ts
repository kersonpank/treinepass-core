
/**
 * Configuração para a API do Asaas
 */

export interface AsaasConfig {
  apiKey: string;
  baseUrl: string;
  headers?: Record<string, string>;
}

export function getAsaasConfig(apiKey: string, baseUrl: string): AsaasConfig {
  return {
    apiKey,
    baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'TreinePass-App'
    }
  };
}

/**
 * Cliente simplificado para o Asaas SDK
 */
export function getAsaasClient(apiKey: string, isProduction: boolean = false) {
  const baseUrl = isProduction ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
  
  const headers = {
    'Content-Type': 'application/json',
    'access_token': apiKey,
    'User-Agent': 'TreinePass-App'
  };

  // Implementação simplificada do cliente Asaas
  return {
    // Implementa métodos comuns do SDK do Asaas
    createNewPayment: async ({ body }: { body: any }) => {
      const response = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.description || 'Erro ao criar pagamento');
      }
      
      return await response.json();
    },
    
    createNewCustomer: async ({ body }: { body: any }) => {
      const response = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.description || 'Erro ao criar cliente');
      }
      
      return await response.json();
    },
    
    createCheckout: async ({ body }: { body: any }) => {
      const response = await fetch(`${baseUrl}/checkouts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.description || 'Erro ao criar checkout');
      }
      
      return await response.json();
    }
  };
}

/**
 * Função para fazer requisições à API do Asaas
 */
export async function asaasRequest(config: AsaasConfig, endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) {
  const url = `${config.baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: config.headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: responseData.errors?.[0]?.description || 'Erro desconhecido',
        details: responseData
      };
    }
    
    return responseData;
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error);
    throw error;
  }
}
