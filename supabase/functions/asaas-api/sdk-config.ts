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
