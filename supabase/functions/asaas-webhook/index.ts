
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Validate webhook request
    const requestToken = req.headers.get("asaas-access-token");
    
    // Only validate token if webhook token is configured
    if (WEBHOOK_TOKEN && requestToken !== WEBHOOK_TOKEN) {
      console.error("Invalid webhook token");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized: Invalid webhook token",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Parse request body
    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    // Validate payload
    if (!payload.event) {
      console.error("Invalid payload: missing event field");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid payload structure",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // For payment events, validate payment data
    if (payload.event.startsWith("PAYMENT_") && !payload.payment) {
      console.error("Invalid payload: missing payment data for payment event");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid payload: missing payment data",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process webhook using the SQL function
    const { data, error } = await supabase.rpc("process_asaas_webhook", {
      payload,
    });

    if (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error processing webhook: ${error.message}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Webhook processed successfully:", data);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Unexpected error: ${error.message}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
