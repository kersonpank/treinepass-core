
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { event, payment, transfer } = await req.json()
    console.log('Received webhook event:', event)

    // Register event in webhook_events table
    const { error: webhookError } = await supabase
      .from('asaas_webhook_events')
      .insert({
        event_type: event,
        event_data: { payment, transfer }
      })

    if (webhookError) throw webhookError

    // Process payment events
    if (event.startsWith('PAYMENT_')) {
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('asaas_payments')
        .select('*')
        .eq('asaas_id', payment.id)
        .single()

      if (paymentError) throw paymentError

      if (paymentRecord) {
        // Update payment record
        const { error: updateError } = await supabase
          .from('asaas_payments')
          .update({
            status: payment.status,
            payment_date: event === 'PAYMENT_CONFIRMED' ? new Date().toISOString() : paymentRecord.payment_date,
            net_amount: payment.netValue,
            fee_amount: payment.fee,
            total_amount: payment.value,
            payment_date_limit: payment.dueDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.id)

        if (updateError) throw updateError

        // Update subscription status if this is a subscription payment
        if (paymentRecord.subscription_id) {
          const subscriptionStatus = event === 'PAYMENT_CONFIRMED' ? 'active' : 
                                   event === 'PAYMENT_OVERDUE' ? 'overdue' :
                                   event === 'PAYMENT_DELETED' ? 'cancelled' : 'pending'

          const { error: subscriptionError } = await supabase
            .from('user_plan_subscriptions')
            .update({
              status: subscriptionStatus,
              payment_status: payment.status,
              last_payment_date: event === 'PAYMENT_CONFIRMED' ? new Date().toISOString() : null,
              next_payment_date: payment.dueDate
            })
            .eq('id', paymentRecord.subscription_id)

          if (subscriptionError) throw subscriptionError
        }

        // Register financial transaction
        const { error: transactionError } = await supabase
          .from('financial_transactions')
          .insert({
            transaction_type: 'payment',
            entity_type: 'user',
            entity_id: paymentRecord.customer_id,
            amount: payment.value,
            fee_amount: payment.fee,
            net_amount: payment.netValue,
            status: payment.status,
            description: `Payment ${payment.id} - ${event}`,
            processed_at: new Date().toISOString()
          })

        if (transactionError) throw transactionError
      }
    }

    // Process transfer events
    if (event.startsWith('TRANSFER_')) {
      const { data: transferRecord, error: transferError } = await supabase
        .from('asaas_transfers')
        .select('*')
        .eq('asaas_id', transfer.id)
        .single()

      if (transferError) throw transferError

      if (transferRecord) {
        // Update transfer record
        const { error: updateError } = await supabase
          .from('asaas_transfers')
          .update({
            status: transfer.status,
            transfer_date: event === 'TRANSFER_COMPLETED' ? new Date().toISOString() : transferRecord.transfer_date,
            net_amount: transfer.netValue,
            fee_amount: transfer.fee,
            scheduled_date: transfer.scheduledDate,
            processing_date: transfer.effectiveDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', transferRecord.id)

        if (updateError) throw updateError

        // Register financial transaction
        const { error: transactionError } = await supabase
          .from('financial_transactions')
          .insert({
            transaction_type: 'transfer',
            entity_type: 'academia',
            entity_id: transferRecord.academia_id,
            amount: transfer.value,
            fee_amount: transfer.fee,
            net_amount: transfer.netValue,
            status: transfer.status === 'COMPLETED' ? 'paid' : 'pending',
            description: `Transfer ${transfer.id} - ${event}`,
            processed_at: new Date().toISOString()
          })

        if (transactionError) throw transactionError
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
