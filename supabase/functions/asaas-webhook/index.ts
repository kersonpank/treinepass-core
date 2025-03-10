
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

    // Extract payment or subscription ID if available
    const paymentId = payload.payment?.id;
    const subscriptionId = payload.payment?.subscription || payload.subscription?.id;
    const eventType = payload.event;
    const paymentStatus = payload.payment?.status;
    
    console.log(`Processing ${eventType} event:`, {
      paymentId,
      subscriptionId,
      status: paymentStatus,
    });

    // Process webhook using RPC function
    const { data, error } = await supabase.rpc("process_asaas_webhook", {
      payload,
    });

    if (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          event: eventType,
          status: paymentStatus || payload.subscription?.status,
          message: error.message,
          payment_id: paymentId,
          subscription_id: subscriptionId
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Webhook processed successfully:", data);

    // If it's a payment status update, manually update the user_plan_subscriptions table
    // This ensures the UI gets updated with the latest payment status
    if (eventType.startsWith('PAYMENT_') && paymentStatus && subscriptionId) {
      try {
        // Map Asaas payment status to our internal status
        const internalPaymentStatus = mapAsaasPaymentStatus(paymentStatus);
        const internalSubscriptionStatus = internalPaymentStatus === 'paid' ? 'active' : 
                                         (internalPaymentStatus === 'overdue' ? 'overdue' : 
                                          (internalPaymentStatus === 'cancelled' || internalPaymentStatus === 'refunded' ? 'cancelled' : 'pending'));
        
        console.log(`Updating subscription status:`, {
          asaas_subscription_id: subscriptionId,
          payment_status: internalPaymentStatus,
          subscription_status: internalSubscriptionStatus
        });

        // First try to find subscription by asaas_subscription_id
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("user_plan_subscriptions")
          .select("id")
          .eq("asaas_subscription_id", subscriptionId)
          .maybeSingle();

        if (subscriptionError) {
          console.error("Error finding subscription by asaas_subscription_id:", subscriptionError);
        }

        // If found by asaas_subscription_id, update it
        if (subscriptionData?.id) {
          const { error: updateError } = await supabase
            .from("user_plan_subscriptions")
            .update({
              payment_status: internalPaymentStatus,
              status: internalSubscriptionStatus,
              last_payment_date: internalPaymentStatus === 'paid' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq("id", subscriptionData.id);

          if (updateError) {
            console.error("Error updating subscription status:", updateError);
          } else {
            console.log(`Successfully updated subscription ${subscriptionData.id} status to ${internalPaymentStatus}`);
          }
        } else {
          // If not found by asaas_subscription_id, try to find by looking at asaas_payments
          const { data: paymentData, error: paymentError } = await supabase
            .from("asaas_payments")
            .select("subscription_id")
            .eq("asaas_id", paymentId)
            .maybeSingle();

          if (paymentError) {
            console.error("Error finding payment:", paymentError);
          } else if (paymentData?.subscription_id) {
            const { error: updateError } = await supabase
              .from("user_plan_subscriptions")
              .update({
                payment_status: internalPaymentStatus,
                status: internalSubscriptionStatus,
                last_payment_date: internalPaymentStatus === 'paid' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq("id", paymentData.subscription_id);

            if (updateError) {
              console.error("Error updating subscription status:", updateError);
            } else {
              console.log(`Successfully updated subscription ${paymentData.subscription_id} status to ${internalPaymentStatus}`);
            }
          } else {
            console.log("Unable to find subscription for this payment");
          }
        }
      } catch (err) {
        console.error("Error updating subscription status:", err);
      }
    }

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

/**
 * Maps Asaas payment status to our internal payment status
 */
function mapAsaasPaymentStatus(asaasStatus: string): string {
  const statusMap: Record<string, string> = {
    'CONFIRMED': 'paid',
    'RECEIVED': 'paid',
    'RECEIVED_IN_CASH': 'paid',
    'PAYMENT_APPROVED_BY_RISK_ANALYSIS': 'paid',
    'PENDING': 'pending',
    'AWAITING_RISK_ANALYSIS': 'pending',
    'AWAITING_CHARGEBACK_REVERSAL': 'pending',
    'OVERDUE': 'overdue',
    'REFUNDED': 'refunded',
    'REFUND_REQUESTED': 'refunded',
    'REFUND_IN_PROGRESS': 'refunded',
    'PARTIALLY_REFUNDED': 'refunded',
    'CHARGEBACK_REQUESTED': 'refunded',
    'CHARGEBACK_DISPUTE': 'refunded',
    'DUNNING_REQUESTED': 'overdue',
    'DUNNING_RECEIVED': 'overdue',
    'CANCELLED': 'cancelled',
    'PAYMENT_DELETED': 'cancelled',
    'PAYMENT_REPROVED_BY_RISK_ANALYSIS': 'failed'
  };
  
  return statusMap[asaasStatus] || 'pending';
}
