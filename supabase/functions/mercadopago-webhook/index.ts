
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { createHmac } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Configurações de CORS para aceitar requisições de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URL e chave do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Cliente Supabase com a service role key para ter acesso completo ao banco
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Webhook secret do Mercado Pago para validação
const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET') || 'e45c42beabab6ad09718911cf1a5f2d17bded9d2609772bd98cbd39e128e881e'

serve(async (req) => {
  console.log('[MercadoPago Webhook] Requisição recebida')
  
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log('[MercadoPago Webhook] Respondendo a requisição OPTIONS')
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Extrair dados da requisição
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const topic = searchParams.get('topic') || searchParams.get('type')
    
    // Log para debug
    console.log('[MercadoPago Webhook] Recebido:', { id, topic, headers: Object.fromEntries(req.headers.entries()) })

    // Tentar obter o corpo da requisição como JSON
    let body = {}
    const rawBody = await req.text()
    
    try {
      body = JSON.parse(rawBody)
      console.log('[MercadoPago Webhook] Corpo da requisição:', JSON.stringify(body, null, 2))
    } catch (e) {
      console.log('[MercadoPago Webhook] Sem corpo JSON na requisição ou formato inválido:', e.message)
    }
    
    // Verificar assinatura do webhook (se disponível)
    const signatureHeader = req.headers.get('x-signature') || req.headers.get('X-Signature')
    let signatureValid = false
    
    if (signatureHeader && webhookSecret) {
      try {
        // Criar HMAC usando o webhookSecret e comparar com o cabeçalho x-signature
        const computedSignature = createHmac("sha256", webhookSecret)
          .update(rawBody)
          .toString("hex");
          
        signatureValid = computedSignature === signatureHeader;
        
        console.log('[MercadoPago Webhook] Validação de assinatura:', { 
          recebida: signatureHeader, 
          calculada: computedSignature, 
          valida: signatureValid 
        });
      } catch (e) {
        console.error('[MercadoPago Webhook] Erro ao validar assinatura:', e.message);
      }
    } else {
      console.log('[MercadoPago Webhook] Assinatura não fornecida ou secret não configurado');
      // Como estamos no modo de teste/desenvolvimento, continuamos mesmo sem validação
      signatureValid = true;
    }
    
    // Em produção, você pode querer rejeitar webhooks não autenticados
    // if (!signatureValid) {
    //   return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
    //     status: 401, // Unauthorized
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    //   });
    // }
    
    // Registrar o evento no banco de dados para auditoria
    const { error: logError } = await supabase
      .from('mercadopago_webhook_events')
      .insert({
        event_id: id || 'unknown',
        event_type: topic || 'unknown',
        payload: body,
        status: 'received',
        signature_valid: signatureValid
      })
      
    if (logError) {
      console.error('[MercadoPago Webhook] Erro ao registrar evento:', logError)
    }

    // Se for uma notificação de pagamento, processar
    if (topic === 'payment') {
      console.log('[MercadoPago Webhook] Processando notificação de pagamento')
      
      // Obter as credenciais do Mercado Pago do ambiente
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      
      if (!accessToken) {
        throw new Error('Token de acesso do Mercado Pago não configurado')
      }
      
      try {
        // Buscar detalhes do pagamento diretamente na API do Mercado Pago
        console.log(`[MercadoPago Webhook] Buscando dados do pagamento ${id}`)
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        console.log(`[MercadoPago Webhook] Status da resposta: ${paymentResponse.status}`)
        
        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text()
          console.error(`[MercadoPago Webhook] Erro ao buscar pagamento: ${paymentResponse.status} - ${paymentResponse.statusText}`)
          console.error(`[MercadoPago Webhook] Detalhes do erro: ${errorText}`)
          throw new Error(`Erro ao buscar pagamento: ${paymentResponse.statusText}`)
        }
        
        const paymentData = await paymentResponse.json()
        console.log('[MercadoPago Webhook] Dados do pagamento:', JSON.stringify(paymentData, null, 2))
        
        // Extrair o external_reference que contém os IDs do plano e usuário
        const externalReference = paymentData.external_reference // Formato esperado: 'plan_PLANID_user_USERID'
        let planId = null
        let userId = null
        
        if (externalReference && externalReference.includes('plan_') && externalReference.includes('user_')) {
          const parts = externalReference.split('_')
          if (parts.length >= 4) {
            planId = parts[1]
            userId = parts[3]
          }
        }
        
        console.log('[MercadoPago Webhook] Referências extraídas:', { planId, userId })
        
        // Atualizar registro de pagamento no banco de dados
        const { error: updatePaymentError } = await supabase
          .from('payments')
          .update({
            status: paymentData.status,
            updated_at: new Date().toISOString(),
            metadata: {
              ...paymentData,
              webhook_processed_at: new Date().toISOString()
            }
          })
          .eq('external_id', id)
          
        if (updatePaymentError) {
          console.error('[MercadoPago Webhook] Erro ao atualizar pagamento:', updatePaymentError)
        } else {
          console.log('[MercadoPago Webhook] Registro de pagamento atualizado com sucesso')
        }
        
        // Se o pagamento foi aprovado, atualizar a assinatura
        if (paymentData.status === 'approved' && userId && planId) {
          console.log('[MercadoPago Webhook] Pagamento aprovado. Atualizando assinatura')
          const { error: subscriptionError } = await supabase
            .from('user_plan_subscriptions')
            .update({
              status: 'active',
              payment_status: 'paid',
              payment_id: id,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('plan_id', planId)
            .eq('status', 'pending')
            
          if (subscriptionError) {
            console.error('[MercadoPago Webhook] Erro ao atualizar assinatura:', subscriptionError)
          } else {
            console.log('[MercadoPago Webhook] Assinatura ativada com sucesso')
          }
        }
        
        // Atualizar o status do evento webhook
        const { error: updateEventError } = await supabase
          .from('mercadopago_webhook_events')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('event_id', id)
          
        if (updateEventError) {
          console.error('[MercadoPago Webhook] Erro ao atualizar evento webhook:', updateEventError)
        }
        
      } catch (error) {
        console.error('[MercadoPago Webhook] Erro ao processar pagamento:', error)
        
        // Registrar erro no evento
        const { error: updateEventError } = await supabase
          .from('mercadopago_webhook_events')
          .update({
            status: 'error',
            error_message: error.message
          })
          .eq('event_id', id)
          
        if (updateEventError) {
          console.error('[MercadoPago Webhook] Erro ao atualizar status do evento webhook:', updateEventError)
        }
      }
    }
    
    // Retornar resposta de sucesso
    console.log('[MercadoPago Webhook] Processamento concluído com sucesso')
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('[MercadoPago Webhook] Erro geral:', error)
    
    // Retornar resposta de erro
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno ao processar webhook'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
