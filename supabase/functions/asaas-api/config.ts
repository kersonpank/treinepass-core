
export async function getAsaasApiKey(supabase: any) {
  try {
    // Get Asaas settings from the database
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'asaas_settings')
      .single();
    
    if (error) throw error;
    
    const asaasSettings = data.value;
    const environment = asaasSettings.environment || 'sandbox';
    const apiKey = environment === 'production' 
      ? asaasSettings.production_api_key 
      : asaasSettings.sandbox_api_key;
    
    if (!apiKey) {
      throw new Error(`API key not configured for ${environment} environment`);
    }
    
    return { 
      apiKey,
      environment,
      baseUrl: environment === 'production' 
        ? 'https://api.asaas.com/v3' 
        : 'https://api-sandbox.asaas.com/v3'
    };
  } catch (error) {
    console.error('Error getting Asaas API key:', error);
    throw error;
  }
}
