
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get webhook payload
    const payload = await req.json();
    console.log('Received webhook:', payload);

    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('asaas_webhook_events')
      .insert({
        event_type: payload.event,
        event_data: payload
      })
      .select()
      .single();

    if (webhookError) {
      throw webhookError;
    }

    // Process payment events
    if (payload.event.startsWith('PAYMENT_')) {
      const payment = payload.payment;
      const subscription = payment.subscription;

      // Se não tiver subscription ID, não é um pagamento de assinatura
      if (!subscription) {
        console.log('Payment not associated with a subscription:', payment.id);
        return new Response(
          JSON.stringify({ success: true, message: 'Non-subscription payment processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Find subscription by Asaas ID
      const { data: userSubscription } = await supabase
        .from('user_plan_subscriptions')
        .select('*')
        .eq('asaas_subscription_id', subscription)
        .single();

      if (!userSubscription) {
        throw new Error('Subscription not found');
      }

      // Update subscription status based on payment status
      let subscriptionStatus: string;
      let paymentStatus: string;

      switch (payload.event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          subscriptionStatus = 'active';
          paymentStatus = 'paid';
          break;
        case 'PAYMENT_OVERDUE':
          subscriptionStatus = 'overdue';
          paymentStatus = 'overdue';
          break;
        case 'PAYMENT_REFUNDED':
          subscriptionStatus = 'canceled';
          paymentStatus = 'refunded';
          break;
        case 'PAYMENT_DELETED':
          // Não alteramos o status da assinatura quando um pagamento é deletado
          paymentStatus = 'canceled';
          break;
        case 'PAYMENT_CREATED':
          paymentStatus = 'pending';
          break;
        default:
          console.log('Unhandled payment event:', payload.event);
          return new Response(
            JSON.stringify({ success: true, message: 'Event logged but not processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
      }

      // Only update subscription if we have a new status
      if (subscriptionStatus) {
        const { error: updateError } = await supabase
          .from('user_plan_subscriptions')
          .update({
            status: subscriptionStatus,
            payment_status: paymentStatus,
            last_payment_date: payment.paymentDate ? new Date(payment.paymentDate) : null,
            next_payment_date: payment.dueDate ? new Date(payment.dueDate) : null
          })
          .eq('id', userSubscription.id);

        if (updateError) {
          throw updateError;
        }
      }

      // Store payment record
      const { error: paymentError } = await supabase
        .from('asaas_payments')
        .insert({
          asaas_id: payment.id,
          customer_id: userSubscription.user_id,
          subscription_id: userSubscription.id,
          amount: payment.value,
          net_amount: payment.netValue,
          fee_amount: payment.fee,
          billing_type: payment.billingType,
          status: payment.status,
          due_date: payment.dueDate,
          payment_date: payment.paymentDate,
          invoice_url: payment.invoiceUrl,
          payment_method: payment.billingType.toLowerCase(),
          total_amount: payment.totalValue,
          payment_link: payment.paymentLink
        });

      if (paymentError) {
        throw paymentError;
      }

      // If payment confirmed, log for future notifications implementation
      if (subscriptionStatus === 'active') {
        console.log('Payment confirmed for subscription:', userSubscription.id);
      }
    }

    // Process subscription deletion (only event available)
    if (payload.event === 'SUBSCRIPTION_DELETED') {
      const subscription = payload.subscription;

      // Find subscription by Asaas ID
      const { data: userSubscription } = await supabase
        .from('user_plan_subscriptions')
        .select('*')
        .eq('asaas_subscription_id', subscription.id)
        .single();

      if (!userSubscription) {
        throw new Error('Subscription not found');
      }

      // Update subscription to canceled status
      const { error: updateError } = await supabase
        .from('user_plan_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', userSubscription.id);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
