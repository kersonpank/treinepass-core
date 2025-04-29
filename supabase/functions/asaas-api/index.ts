
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCreatePaymentLink } from "./handlers/paymentLink.ts";
import { handleCreateCustomer } from "./handlers/customer.ts";
import { handleAction } from "./actions.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API keys from environment
    const apiKey = Deno.env.get('ASAAS_API_KEY');
    const baseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3';
    
    // Format API key - remove prefixes if present
    const formattedApiKey = apiKey?.startsWith('$aact_') ? apiKey.substring(6) : apiKey;
    
    // Validate API key
    if (!formattedApiKey) {
      throw new Error('Missing ASAAS_API_KEY environment variable');
    }

    console.log(`Using Asaas API: ${baseUrl}`);
    console.log(`API Key present: ${formattedApiKey ? 'Yes (first 4 chars: ' + formattedApiKey.substring(0, 4) + '...)' : 'No'}`);
    
    // Parse request body
    const requestData = await req.json();
    console.log("Received request with action:", requestData.action);
    
    if (!requestData.action) {
      throw new Error('Missing "action" parameter');
    }

    // Process based on action using the handleAction function
    const result = await handleAction(requestData.action, requestData.data, formattedApiKey, baseUrl, null);

    // Return successful response
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    // Return error response
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
