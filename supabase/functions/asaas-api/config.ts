
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

export async function getAsaasApiKey(supabase: any) {
  try {
    // Try to get from environment variables first
    const envApiKey = Deno.env.get('ASAAS_API_KEY');
    const envBaseUrl = Deno.env.get('ASAAS_BASE_URL');
    
    if (envApiKey && envApiKey !== 'sua_chave_api_do_asaas') {
      console.log("Using Asaas API key from environment variables");
      return {
        apiKey: envApiKey,
        baseUrl: envBaseUrl || 'https://api-sandbox.asaas.com/v3'
      };
    }
    
    // If not in env vars, try to get from database settings
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'asaas_settings')
      .single();
      
    if (error) {
      console.error("Error fetching Asaas settings:", error);
      throw new Error("Failed to fetch Asaas API settings");
    }
    
    if (!data || !data.value) {
      throw new Error("Asaas API settings not found");
    }
    
    let settings;
    if (typeof data.value === 'string') {
      try {
        settings = JSON.parse(data.value);
      } catch (e) {
        console.error("Error parsing settings JSON:", e);
        throw new Error("Invalid Asaas settings format");
      }
    } else {
      settings = data.value;
    }
    
    // Determine environment and return appropriate key
    const environment = settings.environment || 'sandbox';
    console.log(`Using Asaas ${environment} environment`);
    
    if (environment === 'production') {
      if (!settings.production_api_key) {
        throw new Error("Production API key not configured");
      }
      return {
        apiKey: settings.production_api_key,
        baseUrl: 'https://api.asaas.com/v3'
      };
    } else {
      if (!settings.sandbox_api_key) {
        throw new Error("Sandbox API key not configured");
      }
      return {
        apiKey: settings.sandbox_api_key,
        baseUrl: 'https://api-sandbox.asaas.com/v3'
      };
    }
  } catch (error) {
    console.error("Error in getAsaasApiKey:", error);
    
    // Fallback to environment variable or provide a clear error
    const envApiKey = Deno.env.get('ASAAS_API_KEY');
    if (envApiKey && envApiKey !== 'sua_chave_api_do_asaas') {
      console.warn("Falling back to environment variable API key");
      return {
        apiKey: envApiKey,
        baseUrl: 'https://api-sandbox.asaas.com/v3'
      };
    }
    
    throw new Error("No valid Asaas API key found. Please configure it in system settings or environment variables.");
  }
}
