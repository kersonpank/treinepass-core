
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { getAsaasApiKey } from "./config.ts";
import { handleAction } from "./actions.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { action, data } = await req.json();
    console.log(`Processing ${action} with data:`, data);

    // Get Asaas API configuration
    const { apiKey, baseUrl } = await getAsaasApiKey(supabase);
    console.log(`Using Asaas API: ${baseUrl}`);

    // Process the action
    const response = await handleAction(action, data, apiKey, baseUrl, supabase);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
