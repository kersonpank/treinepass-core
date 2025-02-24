
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const webhook = await req.json()

    // Registrar evento do webhook
    const { error: webhookError } = await supabase
      .from('asaas_webhook_events')
      .insert({
        event_type: webhook.event,
        event_data: webhook
      })

    if (webhookError) throw webhookError

    // Processar pagamento
    if (webhook.event.startsWith('PAYMENT_')) {
      const { data: payment, error: paymentError } = await supabase
        .from('asaas_payments')
        .update({
          status: webhook.payment.status,
          payment_date: webhook.event === 'PAYMENT_CONFIRMED' ? new Date() : null
        })
        .eq('asaas_id', webhook.payment.id)
        .select()
        .single()

      if (paymentError) throw paymentError

      // Atualizar status da assinatura
      if (payment.subscription_id) {
        await supabase
          .from('user_plan_subscriptions')
          .update({
            payment_status: webhook.payment.status === 'CONFIRMED' ? 'paid' : 'pending',
            last_payment_date: webhook.payment.paymentDate
          })
          .eq('asaas_subscription_id', payment.subscription_id)
      }
    }

    // Processar transferência
    if (webhook.event.startsWith('TRANSFER_')) {
      const { error: transferError } = await supabase
        .from('asaas_transfers')
        .update({
          status: webhook.transfer.status,
          transfer_date: webhook.event === 'TRANSFER_COMPLETED' ? new Date() : null
        })
        .eq('asaas_id', webhook.transfer.id)

      if (transferError) throw transferError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
