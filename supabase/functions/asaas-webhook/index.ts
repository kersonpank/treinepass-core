
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to validate token
function validateWebhookToken(token: string): boolean {
  if (!WEBHOOK_SECRET) return true; // If no secret is set, allow all requests (for development)
  return token === WEBHOOK_SECRET;
}

serve(async (req) => {
  console.log("Listening on http://localhost:9999/");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate token from headers
    const token = req.headers.get("asaas-webhook-token") || "";
    if (!validateWebhookToken(token)) {
      console.error("Invalid webhook token");
      return new Response(
        JSON.stringify({ success: false, message: "Invalid webhook token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse JSON payload
    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    // 3. Ensure payload has the right structure
    if (!payload.event || (!payload.payment && !payload.subscription)) {
      console.error("Invalid payload structure");
      return new Response(
        JSON.stringify({ success: false, message: "Invalid payload structure" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Create Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 5. Process webhook using the database function
    const { data, error } = await supabase.rpc("process_asaas_webhook", {
      payload,
    });

    if (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message,
          event: payload.event,
          status: payload.payment?.status,
          payment_id: payload.payment?.id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Webhook processed successfully:", data);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
