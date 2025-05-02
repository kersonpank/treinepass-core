// This file contains functions to interact with the Asaas API

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface AsaasPaymentLink {
  id: string;
  url: string;
  description?: string;
  value: number;
  expirationDate?: string;
  status: string;
}

// Format API key for Asaas
export function formatAsaasApiKey(apiKey: string): string {
  // If key already has the $aact_ prefix, return as is
  if (apiKey.startsWith('$aact_')) {
    return apiKey;
  }
  // Otherwise, add the prefix (required by Asaas API)
  return `$aact_${apiKey}`;
}

// Extract the raw token part from the API key
export function extractAsaasApiToken(apiKey: string): string {
  // If key has the $aact_ prefix, remove it
  if (apiKey.startsWith('$aact_')) {
    return apiKey.substring(6);
  }
  return apiKey;
}

// Get the base URL for Asaas API (sandbox or production)
export function getAsaasBaseUrl(isSandbox: boolean = true): string {
  return isSandbox 
    ? 'https://api-sandbox.asaas.com/v3' 
    : 'https://api.asaas.com/v3';
}
