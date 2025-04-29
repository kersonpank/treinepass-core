
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCreatePaymentLink } from "./handlers/paymentLink.ts";
import { handleCreateCustomer } from "./handlers/customer.ts";

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
    const baseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3';
    
    // Validate API key
    if (!apiKey) {
      throw new Error('Missing ASAAS_API_KEY environment variable');
    }

    console.log(`Using Asaas API: ${baseUrl}`);
    
    // Parse request body
    const requestData = await req.json();
    console.log("Received request:", JSON.stringify(requestData, null, 2));
    
    if (!requestData.action) {
      throw new Error('Missing "action" parameter');
    }

    // Process based on action
    let result;
    switch (requestData.action) {
      case 'createCustomer':
        result = await handleCreateCustomer(requestData.data, apiKey, baseUrl);
        break;
        
      case 'createPaymentLink':
        result = await handleCreatePaymentLink(requestData.data, apiKey, baseUrl);
        break;
        
      default:
        throw new Error(`Unsupported action: ${requestData.action}`);
    }

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
