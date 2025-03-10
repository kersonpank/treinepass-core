
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to verify webhook token
async function verifyWebhookToken(token: string): Promise<boolean> {
  try {
    // Fetch Asaas settings
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "asaas_settings")
      .single();

    if (error || !data) {
      console.error("Error fetching Asaas settings:", error);
      return false;
    }

    // Verify token corresponds
    const webhookToken = data.value?.webhook_token;
    
    if (!webhookToken) {
      console.error("Webhook token not configured");
      return false;
    }

    return token === webhookToken;
  } catch (err) {
    console.error("Error verifying token:", err);
    return false;
  }
}

// Main function to process webhooks
serve(async (req) => {
  // Handle OPTIONS requests (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verify method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    // Get webhook payload
    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    // Verify payload has correct structure
    if (!payload.event) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid payload", 
          message: "Event not specified"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Process webhook using RPC function
    const { data, error } = await supabase.rpc("process_asaas_webhook", {
      payload,
    });

    if (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          event: payload.event,
          status: payload.payment?.status || payload.subscription?.status,
          message: error.message,
          payment_id: payload.payment?.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Webhook processed successfully:", data);

    return new Response(
      JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: err.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
