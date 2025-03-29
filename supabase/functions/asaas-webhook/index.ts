
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
    const externalReference = payload.payment?.externalReference;
    
    console.log(`Processing ${eventType} event:`, {
      paymentId,
      subscriptionId,
      status: paymentStatus,
      externalReference
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

    // Direct update to ensure UI reflects changes immediately
    if (eventType.startsWith('PAYMENT_') && paymentStatus) {
      try {
        // Map Asaas payment status to our internal status
        const internalPaymentStatus = mapAsaasPaymentStatus(paymentStatus);
        const internalSubscriptionStatus = internalPaymentStatus === 'paid' ? 'active' : 
                                         (internalPaymentStatus === 'overdue' ? 'overdue' : 
                                          (internalPaymentStatus === 'cancelled' || internalPaymentStatus === 'refunded' ? 'cancelled' : 'pending'));
        
        console.log(`Updating subscription directly:`, {
          externalReference,
          asaas_subscription_id: subscriptionId,
          payment_status: internalPaymentStatus,
          subscription_status: internalSubscriptionStatus
        });

        // First try to find subscription by external reference (direct match with our ID)
        if (externalReference) {
          const { data: directMatchSubscription, error: directMatchError } = await supabase
            .from("user_plan_subscriptions")
            .select("id")
            .eq("id", externalReference)
            .maybeSingle();

          if (!directMatchError && directMatchSubscription?.id) {
            // Update the subscription that matches the external reference
            const { error: updateError } = await supabase
              .from("user_plan_subscriptions")
              .update({
                payment_status: internalPaymentStatus,
                status: internalSubscriptionStatus,
                last_payment_date: internalPaymentStatus === 'paid' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq("id", directMatchSubscription.id);

            if (updateError) {
              console.error("Error updating subscription by direct match:", updateError);
            } else {
              console.log(`Successfully updated subscription ${directMatchSubscription.id} status to ${internalPaymentStatus}`);
              
              // If payment is paid/confirmed, cancel other pending subscriptions for this user
              if (internalPaymentStatus === 'paid') {
                // Get the user_id for this subscription
                const { data: subscription, error: subscriptionError } = await supabase
                  .from("user_plan_subscriptions")
                  .select("user_id")
                  .eq("id", directMatchSubscription.id)
                  .single();
                
                if (!subscriptionError && subscription?.user_id) {
                  // Cancel other pending subscriptions for this user
                  const { error: cancelError } = await supabase
                    .from("user_plan_subscriptions")
                    .update({
                      status: 'cancelled',
                      updated_at: new Date().toISOString()
                    })
                    .eq("user_id", subscription.user_id)
                    .eq("status", "pending")
                    .neq("id", directMatchSubscription.id);
                  
                  if (cancelError) {
                    console.error("Error cancelling other pending subscriptions:", cancelError);
                  } else {
                    console.log(`Successfully cancelled other pending subscriptions for user ${subscription.user_id}`);
                  }
                }
              }
            }
          }
        }

        // If not found by external reference, try to find by looking at asaas_subscription_id
        if (subscriptionId) {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from("user_plan_subscriptions")
            .select("id")
            .eq("asaas_subscription_id", subscriptionId)
            .maybeSingle();

          if (!subscriptionError && subscriptionData?.id) {
            // Update the subscription that matches the asaas_subscription_id
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
              console.error("Error updating subscription by asaas_subscription_id:", updateError);
            } else {
              console.log(`Successfully updated subscription ${subscriptionData.id} status to ${internalPaymentStatus}`);
              
              // If payment is paid/confirmed, cancel other pending subscriptions for this user
              if (internalPaymentStatus === 'paid') {
                // Get the user_id for this subscription
                const { data: subscription, error: subscriptionError } = await supabase
                  .from("user_plan_subscriptions")
                  .select("user_id")
                  .eq("id", subscriptionData.id)
                  .single();
                
                if (!subscriptionError && subscription?.user_id) {
                  // Cancel other pending subscriptions for this user
                  const { error: cancelError } = await supabase
                    .from("user_plan_subscriptions")
                    .update({
                      status: 'cancelled',
                      updated_at: new Date().toISOString()
                    })
                    .eq("user_id", subscription.user_id)
                    .eq("status", "pending")
                    .neq("id", subscriptionData.id);
                  
                  if (cancelError) {
                    console.error("Error cancelling other pending subscriptions:", cancelError);
                  } else {
                    console.log(`Successfully cancelled other pending subscriptions for user ${subscription.user_id}`);
                  }
                }
              }
            }
          }
        }

        // If still not found, try to find by looking at asaas_payments
        if (paymentId) {
          const { data: paymentData, error: paymentError } = await supabase
            .from("asaas_payments")
            .select("subscription_id")
            .eq("asaas_id", paymentId)
            .maybeSingle();

          if (!paymentError && paymentData?.subscription_id) {
            // Update the subscription that's linked to this payment
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
              console.error("Error updating subscription through payment:", updateError);
            } else {
              console.log(`Successfully updated subscription ${paymentData.subscription_id} status to ${internalPaymentStatus}`);
              
              // If payment is paid/confirmed, cancel other pending subscriptions for this user
              if (internalPaymentStatus === 'paid') {
                // Get the user_id for this subscription
                const { data: subscription, error: subscriptionError } = await supabase
                  .from("user_plan_subscriptions")
                  .select("user_id")
                  .eq("id", paymentData.subscription_id)
                  .single();
                
                if (!subscriptionError && subscription?.user_id) {
                  // Cancel other pending subscriptions for this user
                  const { error: cancelError } = await supabase
                    .from("user_plan_subscriptions")
                    .update({
                      status: 'cancelled',
                      updated_at: new Date().toISOString()
                    })
                    .eq("user_id", subscription.user_id)
                    .eq("status", "pending")
                    .neq("id", paymentData.subscription_id);
                  
                  if (cancelError) {
                    console.error("Error cancelling other pending subscriptions:", cancelError);
                  } else {
                    console.log(`Successfully cancelled other pending subscriptions for user ${subscription.user_id}`);
                  }
                }
              }
            }
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
