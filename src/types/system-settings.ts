
/**
 * Tipos para configurações do sistema
 */

export type PaymentGatewayType = 'asaas' | 'mercadopago';

export interface PaymentGatewaySettings {
  active_gateway: PaymentGatewayType;
}

export interface AsaasSettings {
  environment: 'sandbox' | 'production';
  sandbox_api_key: string;
  production_api_key: string;
  webhook_token: string;
}

/**
 * Função para extrair token da API do Asaas
 * Remove prefixos e sufixos do formato de token completo
 */
export function extractAsaasApiToken(key: string | null | undefined): string | null {
  if (!key) return null;
  
  try {
    // Se a chave começar com $aact_, extrair apenas a parte do token
    if (key.startsWith('$aact_')) {
      const tokenPart = key.substring(6); // Remove '$aact_'
      // Se houver ::, pegar apenas a primeira parte
      const endIndex = tokenPart.indexOf('::');
      return endIndex > 0 ? tokenPart.substring(0, endIndex) : tokenPart;
    }
    
    return key; // Se não tiver o prefixo, retornar como está
  } catch (error) {
    console.error("Erro ao extrair token da API do Asaas:", error);
    return key; // Em caso de erro, retornar a chave original
  }
}

// Tipo para database do Supabase
export interface SystemSettingsRow {
  id?: string;
  key: string;
  value: any;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
