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
    const externalReference = payload.payment?.externalReference || payload.subscription?.externalReference;
    const customerData = payload.customer || {};
    
    console.log(`Processing ${eventType} event:`, {
      paymentId,
      subscriptionId,
      status: paymentStatus,
      externalReference,
      customer: customerData?.id
    });
    
    // Save the webhook event to the database
    await supabase
      .from("asaas_webhook_events")
      .insert({
        event_type: eventType,
        payment_id: paymentId,
        subscription_id: subscriptionId,
        payload,
        processed: false
      });

    // Direct update to ensure UI reflects changes immediately
    if (eventType.startsWith('PAYMENT_') && paymentStatus) {
      try {
        const internalPaymentStatus = mapAsaasPaymentStatus(paymentStatus);
        const internalSubscriptionStatus = internalPaymentStatus === 'paid' ? 'active' : 
                                         (internalPaymentStatus === 'overdue' ? 'overdue' : 
                                          (internalPaymentStatus === 'cancelled' || internalPaymentStatus === 'refunded' ? 'cancelled' : 'pending'));
        
        console.log(`Updating subscription directly:`, {
          externalReference,
          subscription_id: subscriptionId,
          payment_status: internalPaymentStatus,
          subscription_status: internalSubscriptionStatus
        });

        if (externalReference) {
          // Primeiro tentar encontrar na tabela de assinaturas de usuário
          const { data: userSubscription } = await supabase
            .from("user_plan_subscriptions")
            .select("id, user_id")
            .eq("id", externalReference)
            .maybeSingle();

          if (userSubscription) {
            // É uma assinatura de usuário - atualizar e cancelar outras
            await supabase
              .from("user_plan_subscriptions")
              .update({
                payment_status: internalPaymentStatus,
                status: internalSubscriptionStatus,
                last_payment_date: internalPaymentStatus === 'paid' ? new Date().toISOString() : null,
                next_payment_date: calculateNextPaymentDate(payload),
                updated_at: new Date().toISOString(),
                asaas_subscription_id: subscriptionId // Store Asaas subscription ID
              })
              .eq("id", userSubscription.id);
            
            // Se pagamento foi confirmado, cancelar outras assinaturas do usuário
            if (internalPaymentStatus === 'paid') {
              await supabase
                .from("user_plan_subscriptions")
                .update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString()
                })
                .eq("user_id", userSubscription.user_id)
                .neq("id", userSubscription.id);
            }
          } else {
            // Verificar se é uma assinatura empresarial
            const { data: businessSubscription } = await supabase
              .from("business_plan_subscriptions")
              .select("id")
              .eq("id", externalReference)
              .single();

            if (businessSubscription) {
              // É uma assinatura empresarial - apenas atualizar status
              await supabase
                .from("business_plan_subscriptions")
                .update({
                  payment_status: internalPaymentStatus,
                  status: internalSubscriptionStatus,
                  updated_at: new Date().toISOString(),
                  asaas_subscription_id: subscriptionId // Store Asaas subscription ID
                })
                .eq("id", businessSubscription.id);
            }
          }
        }

        // Also update the payment record in our database
        if (paymentId) {
          await supabase
            .from("asaas_payments")
            .update({
              status: paymentStatus,
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("asaas_id", paymentId);
        }
      } catch (err) {
        console.error("Error updating subscription status:", err);
      }
    }

    // Handle business plan subscriptions separately
    if (eventType.startsWith('PAYMENT_') && paymentStatus && externalReference) {
      try {
        // Map Asaas payment status to our internal status
        const internalPaymentStatus = mapAsaasPaymentStatus(paymentStatus);
        const internalSubscriptionStatus = internalPaymentStatus === 'paid' ? 'active' : 
                                         (internalPaymentStatus === 'overdue' ? 'overdue' : 
                                          (internalPaymentStatus === 'cancelled' || internalPaymentStatus === 'refunded' ? 'cancelled' : 'pending'));
        
        // Try to find business subscription by external reference
        const { data: directMatchSubscription } = await supabase
          .from("business_plan_subscriptions")
          .select("id, business_id")
          .eq("id", externalReference)
          .maybeSingle();

        if (directMatchSubscription?.id) {
          // Update the business subscription
          await supabase
            .from("business_plan_subscriptions")
            .update({
              payment_status: internalPaymentStatus,
              status: internalSubscriptionStatus,
              updated_at: new Date().toISOString(),
              asaas_subscription_id: subscriptionId // Store Asaas subscription ID
            })
            .eq("id", directMatchSubscription.id);

          console.log(`Updated business subscription ${directMatchSubscription.id} status to ${internalPaymentStatus}`);
          
          // If payment is confirmed, cancel other pending subscriptions for this business
          if (internalPaymentStatus === 'paid' && directMatchSubscription.business_id) {
            await supabase
              .from("business_plan_subscriptions")
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq("business_id", directMatchSubscription.business_id)
              .eq("status", "pending")
              .neq("id", directMatchSubscription.id);
              
            console.log(`Cancelled other pending subscriptions for business ${directMatchSubscription.business_id}`);
          }
        }
      } catch (err) {
        console.error("Error updating business subscription status:", err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook received and processed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Helper function to map Asaas status to our internal status
function mapAsaasPaymentStatus(asaasStatus: string): string {
  switch (asaasStatus) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "paid";
    case "PENDING":
    case "AWAITING_RISK_ANALYSIS":
      return "pending";
    case "OVERDUE":
      return "overdue";
    case "REFUNDED":
    case "REFUND_REQUESTED":
      return "refunded";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

// Helper function to calculate next payment date based on subscription cycle
function calculateNextPaymentDate(payload: any): string | null {
  try {
    // Get the current payment date or due date
    const currentDate = payload.payment?.paymentDate || payload.payment?.dueDate;
    
    if (!currentDate) return null;
    
    // Get the subscription cycle or default to MONTHLY
    const cycle = payload.subscription?.cycle || 'MONTHLY';
    
    // Calculate next payment date based on cycle
    const date = new Date(currentDate);
    
    switch (cycle) {
      case 'WEEKLY':
        date.setDate(date.getDate() + 7);
        break;
      case 'BIWEEKLY':
        date.setDate(date.getDate() + 14);
        break;
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'SEMIANNUALLY':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'YEARLY':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }
    
    return date.toISOString();
  } catch (error) {
    console.error("Error calculating next payment date:", error);
    return null;
  }
}
