
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  event: string;
  payment?: {
    id: string;
    status: string;
    billingType: string;
    value: number;
    netValue: number;
    customer: string;
    externalReference: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the webhook token from environment
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Log the request for debugging
    console.log("Received webhook request");
    
    // Get the token from the request header if it exists
    const requestToken = req.headers.get("asaas-access-token");
    
    // Verify webhook token if configured
    if (webhookToken && requestToken !== webhookToken) {
      console.error("Invalid webhook token");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid webhook token" 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Parse the webhook payload
    let payload: WebhookPayload;
    try {
      payload = await req.json();
      console.log("Webhook payload:", JSON.stringify(payload));
    } catch (error) {
      console.error("Error parsing webhook payload:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid webhook payload" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Process the webhook
    if (!payload || !payload.event) {
      console.error("Invalid payload structure");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid payload structure" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Log the event type
    console.log(`Processing ${payload.event} event`);
    
    // Process payment-related webhooks
    if (payload.event.startsWith("PAYMENT_") && payload.payment) {
      const paymentId = payload.payment.id;
      const newStatus = payload.payment.status;
      const externalReference = payload.payment.externalReference;
      
      console.log(`Payment ID: ${paymentId}, Status: ${newStatus}, External Reference: ${externalReference}`);
      
      try {
        // First, record the webhook event
        const { error: eventError } = await supabase
          .from("asaas_webhook_events")
          .insert({
            payment_id: paymentId,
            event_type: payload.event,
            status: newStatus,
            payload: payload,
          });
        
        if (eventError) {
          console.error("Error recording webhook event:", eventError);
        }
        
        // Update payment status in asaas_payments table
        if (paymentId) {
          const { data: paymentData, error: paymentError } = await supabase
            .from("asaas_payments")
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq("asaas_id", paymentId)
            .select("id, subscription_id");
          
          if (paymentError) {
            console.error("Error updating payment status:", paymentError);
            throw paymentError;
          }
          
          console.log("Payment update result:", paymentData);
          
          if (paymentData && paymentData.length > 0) {
            const subscriptionId = paymentData[0].subscription_id;
            
            // If payment is confirmed, update subscription status
            if (["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(newStatus)) {
              const { data: subscriptionData, error: subscriptionError } = await supabase
                .from("user_plan_subscriptions")
                .update({ 
                  status: "active",
                  payment_status: "paid",
                  updated_at: new Date().toISOString(),
                  last_payment_date: new Date().toISOString()
                })
                .eq("id", subscriptionId)
                .select();
              
              if (subscriptionError) {
                console.error("Error updating subscription status:", subscriptionError);
                throw subscriptionError;
              }
              
              console.log("Subscription update result:", subscriptionData);
            } else if (["OVERDUE", "REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED"].includes(newStatus)) {
              // Handle overdue or refunded payments
              const { error: subscriptionError } = await supabase
                .from("user_plan_subscriptions")
                .update({ 
                  payment_status: newStatus === "OVERDUE" ? "overdue" : "refunded",
                  updated_at: new Date().toISOString()
                })
                .eq("id", subscriptionId);
              
              if (subscriptionError) {
                console.error("Error updating subscription status:", subscriptionError);
                throw subscriptionError;
              }
            }
          } else {
            console.warn("Payment not found in database:", paymentId);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Webhook processed successfully" 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Error processing webhook", 
            error: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } else {
      // Record non-payment webhooks
      try {
        const { error: eventError } = await supabase
          .from("asaas_webhook_events")
          .insert({
            payment_id: payload.payment?.id || 'unknown',
            event_type: payload.event,
            status: payload.payment?.status || 'unknown',
            payload: payload,
          });
        
        if (eventError) {
          console.error("Error recording webhook event:", eventError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Non-payment webhook recorded" 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      } catch (error) {
        console.error("Error recording non-payment webhook:", error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Error recording non-payment webhook", 
            error: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Internal server error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
