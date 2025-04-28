
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
    let actionData;
    try {
      const requestData = await req.json();
      actionData = requestData;
      console.log(`Processing ${actionData.action} with data:`, JSON.stringify(actionData.data, null, 2));
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body format"
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

    const { action, data } = actionData;
    
    if (!action) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing 'action' parameter"
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

    // Get Asaas configuration
    let apiKey, baseUrl;
    try {
      const config = await getAsaasApiKey(supabase);
      apiKey = config.apiKey;
      baseUrl = config.baseUrl;
      console.log(`Using Asaas API: ${baseUrl}`);
    } catch (error) {
      console.error("Error getting Asaas API key:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to obtain Asaas API configuration: " + error.message,
          details: { message: error.message }
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json",
            "User-Agent": "TreinePass-App"
          } 
        }
      );
    }

    // Process the action
    let response;
    try {
      response = await handleAction(action, data, apiKey, baseUrl, supabase);
      console.log(`Response from ${action}:`, JSON.stringify(response, null, 2));
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Unknown error in action handler",
          details: { action, message: error.message }
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

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json",
          "User-Agent": "TreinePass-App"
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
        details: { message: error.message, stack: error.stack }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json",
          "User-Agent": "TreinePass-App"
        } 
      }
    );
  }
});
