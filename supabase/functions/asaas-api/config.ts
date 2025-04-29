
/**
 * Configuração para a integração com o Asaas API
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

/**
 * Extrai o token da API do Asaas do formato da chave bruta
 * Formato: $aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ3YjczYzA0LWVmMTEtNDk1Ny1hZjI1LTlhNzZlNGRiMjgyOA
 * Resultado: MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ3YjczYzA0LWVmMTEtNDk1Ny1hZjI1LTlhNzZlNGRiMjgyOA
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

/**
 * Obtém a configuração da API do Asaas
 */
export async function getAsaasApiKey(supabase: any) {
  try {
    console.log("Using Asaas API key from environment variables");
    
    // Primeiro, tentar usar a variável de ambiente (para desenvolvimento/testes)
    const apiKeyFromEnv = Deno.env.get('ASAAS_API_KEY');
    if (apiKeyFromEnv) {
      const cleanApiKey = extractAsaasApiToken(apiKeyFromEnv);
      if (cleanApiKey && cleanApiKey.length >= 20) {
        return {
          apiKey: cleanApiKey,
          baseUrl: Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3'
        };
      }
    }
    
    // Se não encontrar na variável de ambiente ou for inválida, buscar no banco de dados
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "asaas_settings")
      .single();
      
    if (error) {
      console.error("Error fetching Asaas settings:", error);
      throw new Error("Falha ao obter configurações do Asaas");
    }
    
    if (!data?.value) {
      throw new Error("Configurações do Asaas não encontradas");
    }
    
    // Obter chave API com base no ambiente
    const settings = data.value;
    const apiKey = settings.environment === 'production' 
      ? extractAsaasApiToken(settings.production_api_key) 
      : extractAsaasApiToken(settings.sandbox_api_key);
    
    if (!apiKey) {
      throw new Error(`Chave API do Asaas não configurada para o ambiente ${settings.environment}`);
    }
    
    // Definir URL base com base no ambiente
    const baseUrl = settings.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';
      
    return { apiKey, baseUrl };
  } catch (error) {
    console.error("Error getting Asaas API config:", error);
    throw error;
  }
}
