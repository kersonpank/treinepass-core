
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { getAsaasApiKey } from "./config.ts";
import { handleAction } from "./actions.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request data
    const { action, data } = await req.json();
    console.log(`Processing ${action} with data:`, JSON.stringify(data, null, 2));

    // Get Asaas configuration
    const { apiKey, baseUrl } = await getAsaasApiKey(supabase);
    console.log(`Using Asaas API: ${baseUrl}`);

    // Process the action
    const response = await handleAction(action, data, apiKey, baseUrl, supabase);
    console.log(`Response from ${action}:`, JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json",
          "User-Agent": "TreinePass-App" // Add User-Agent as per documentation
        },
        status: 200
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
          "Content-Type": "application/json",
          "User-Agent": "TreinePass-App"
        } 
      }
    );
  }
});
