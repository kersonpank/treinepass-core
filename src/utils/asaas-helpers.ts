
/**
 * Utility functions for Asaas API integration
 */

/**
 * Extracts the proper Asaas API token from a provided key string
 * Format examples:
 * Input: $aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ3YjczYzA0LWVmMTEtNDk1Ny1hZjI1LTlhNzZlNGRiMjgyODo6JGFhY2hfOTg1OGRmODctODQzZC00N2E2LWFjZGYtNWUyMTk1ZTM0NTZh
 * Output: MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ3YjczYzA0LWVmMTEtNDk1Ny1hZjI1LTlhNzZlNGRiMjgyOA
 */
export function extractAsaasApiToken(key: string | null | undefined): string | null {
  if (!key) return null;
  
  try {
    // Check if the key starts with the expected prefix
    if (key.startsWith('$aact_')) {
      // Extract the token part (between $aact_ and the first :: if present)
      const match = key.match(/\$aact_([^:]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // If the key doesn't match the expected format, return it as is
    // This allows for direct API keys too
    return key;
  } catch (error) {
    console.error("Error extracting Asaas API token:", error);
    return key; // Return original key if parsing fails
  }
}

/**
 * Validates if an Asaas API key is in a potentially valid format
 */
export function validateAsaasApiKey(key: string | null | undefined): boolean {
  if (!key) return false;
  
  // Extract the token part
  const token = extractAsaasApiToken(key);
  
  // Check if we have a token of reasonable length (24+ chars)
  return token != null && token.length >= 24;
}

/**
 * Formats error messages from Asaas API responses
 */
export function formatAsaasError(error: any): string {
  // Handle HTTP errors
  if (error?.response?.status === 401) {
    return "Erro de autenticação com a API do Asaas. Verifique sua chave API.";
  }
  
  // Handle Asaas specific error formats
  if (error?.response?.data?.errors?.length > 0) {
    return `Erro do Asaas: ${error.response.data.errors[0].description}`;
  }
  
  // Generic error message
  return error?.message || "Erro desconhecido ao processar pagamento";
}
