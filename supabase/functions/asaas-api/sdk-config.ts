
/**
 * Simple SDK configuration for Asaas API
 */

// Configure the API with base URL and key
export function getAsaasConfig(apiKey: string, baseUrl: string) {
  return {
    apiKey,
    baseUrl
  };
}

// Make API requests to Asaas
export async function asaasRequest(config: any, endpoint: string, method: string, data?: any) {
  try {
    const url = `${config.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'access_token': config.apiKey
    };
    
    const requestOptions: RequestInit = {
      method,
      headers
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }
    
    console.log(`Making ${method} request to ${endpoint}`);
    const response = await fetch(url, requestOptions);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new Error(`API Error (${response.status}): ${errorData?.errors?.[0]?.description || errorData?.message || 'Unknown error'}`);
    }
    
    // Parse and return successful response
    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};
    
  } catch (error) {
    console.error("Error making Asaas API request:", error);
    throw error;
  }
}
