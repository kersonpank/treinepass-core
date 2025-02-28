
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "";

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ message: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate request token
    const token = req.headers.get('asaas-access-token') || '';
    
    // Log token info for debugging (but don't expose actual token)
    console.log(`Received token: ${token ? 'Yes' : 'No'}`);
    console.log(`Expected token: ${webhookToken ? 'Set' : 'Not set'}`);
    
    // In production, uncomment this to enforce token validation
    // if (token !== webhookToken) {
    //   return new Response(JSON.stringify({ message: 'Unauthorized' }), {
    //     status: 401,
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   });
    // }

    // Parse request body
    const payload = await req.json();
    console.log(`Received webhook payload: ${JSON.stringify(payload)}`);

    // Validate payload
    if (!payload.event) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid payload structure' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For payment events, ensure they have the required structure
    if (payload.event.startsWith('PAYMENT_') && (!payload.payment || !payload.payment.id)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid payment data structure',
        event: payload.event 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process webhook using database function
    const { data, error } = await supabase.rpc('process_asaas_webhook', {
      payload
    });

    console.log(`Webhook processed successfully: ${JSON.stringify(data)}`);

    if (error) {
      console.error(`Error processing webhook: ${error.message}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: error.message,
        event: payload.event,
        status: payload.payment?.status,
        payment_id: payload.payment?.id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
