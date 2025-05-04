
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { createHmac } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Configurações de CORS para aceitar requisições de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
}

// URL e chave do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Cliente Supabase com a service role key para ter acesso completo ao banco
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Webhook secret do Mercado Pago para validação
const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET') || ''

serve(async (req) => {
  console.log('[MercadoPago Webhook] Requisição recebida')
  console.log('[MercadoPago Webhook] URL:', req.url)
  console.log('[MercadoPago Webhook] Método:', req.method)
  
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Verificar se é POST
  if (req.method !== 'POST') {
    console.error('[MercadoPago Webhook] Método não suportado:', req.method)
    return new Response(JSON.stringify({ error: 'Método não suportado' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    // Extrair dados da requisição
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || searchParams.get('data.id')
    const topic = searchParams.get('topic') || searchParams.get('type') || searchParams.get('action')
    
    // Log para debug
    console.log('[MercadoPago Webhook] Parâmetros de URL:', Object.fromEntries(searchParams.entries()))
    console.log('[MercadoPago Webhook] Recebido:', { id, topic })

    // Tentar obter o corpo da requisição como texto
    const rawBody = await req.text()
    console.log('[MercadoPago Webhook] Corpo da requisição raw:', rawBody)
    
    // Tentar parsear como JSON se não for vazio
    let body = {}
    if (rawBody && rawBody.trim()) {
      try {
        body = JSON.parse(rawBody)
        console.log('[MercadoPago Webhook] Corpo da requisição JSON:', JSON.stringify(body, null, 2))
      } catch (e) {
        console.log('[MercadoPago Webhook] Aviso: Corpo não é um JSON válido:', e.message)
      }
    }
    
    // Extrair dados do evento em diferentes formatos possíveis
    const eventId = id || body?.id || body?.data?.id || 'unknown'
    const eventType = topic || body?.type || body?.action || body?.event || 'unknown'
    let payload = body
    
    // Verificar assinatura do webhook (se disponível)
    const signatureHeader = req.headers.get('x-signature') || req.headers.get('X-Signature')
    let signatureValid = null
    
    console.log('[MercadoPago Webhook] Assinatura recebida:', signatureHeader)
    
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
        signatureValid = false;
      }
    } else {
      console.log('[MercadoPago Webhook] Assinatura não fornecida ou secret não configurado');
      // Como estamos no modo de teste/desenvolvimento, continuamos mesmo sem validação
      signatureValid = null;  // null significa que não foi possível validar
    }
    
    // Registrar o evento no banco de dados para auditoria
    const { error: logError, data: eventRecord } = await supabase
      .from('mercadopago_webhook_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
        payload: payload,
        status: 'received',
        signature_valid: signatureValid
      })
      .select()
      
    if (logError) {
      console.error('[MercadoPago Webhook] Erro ao registrar evento:', logError)
    } else {
      console.log('[MercadoPago Webhook] Evento registrado com sucesso:', eventRecord)
    }

    // Se for uma notificação de pagamento, processar
    if (eventType === 'payment' || eventType === 'payment.updated' || eventType === 'payment.created') {
      console.log('[MercadoPago Webhook] Processando notificação de pagamento')
      
      // Obter as credenciais do Mercado Pago do ambiente
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      
      if (!accessToken) {
        throw new Error('Token de acesso do Mercado Pago não configurado')
      }
      
      // Extrair o ID do pagamento
      const paymentId = eventId !== 'unknown' ? eventId : (body?.data?.id || null)
      
      if (!paymentId) {
        throw new Error('ID do pagamento não encontrado na requisição')
      }
      
      try {
        // Buscar detalhes do pagamento diretamente na API do Mercado Pago
        console.log(`[MercadoPago Webhook] Buscando dados do pagamento ${paymentId}`)
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
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
          .upsert({
            external_id: paymentId,
            user_id: userId,
            status: paymentData.status,
            amount: paymentData.transaction_amount,
            payment_method: paymentData.payment_method_id,
            updated_at: new Date().toISOString(),
            metadata: {
              ...paymentData,
              webhook_processed_at: new Date().toISOString()
            }
          })
          
        if (updatePaymentError) {
          console.error('[MercadoPago Webhook] Erro ao atualizar pagamento:', updatePaymentError)
        } else {
          console.log('[MercadoPago Webhook] Registro de pagamento atualizado com sucesso')
        }
        
        // Se o pagamento foi aprovado, atualizar a assinatura
        if (paymentData.status === 'approved' && userId && planId) {
          console.log('[MercadoPago Webhook] Pagamento aprovado. Atualizando assinatura')
          
          // 1. Cancelar qualquer assinatura pendente desse usuário para esse plano
          const { error: cancelError } = await supabase
            .from('user_plan_subscriptions')
            .update({ 
              status: 'cancelled', 
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString()  
            })
            .eq('user_id', userId)
            .eq('status', 'pending')
            .neq('plan_id', planId);
            
          if (cancelError) {
            console.error('[MercadoPago Webhook] Erro ao cancelar assinaturas pendentes:', cancelError)
          }
          
          // 2. Atualizar a assinatura específica para esse plano
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1); // 1 ano de assinatura
          
          const { error: subscriptionError } = await supabase
            .from('user_plan_subscriptions')
            .update({
              status: 'active',
              payment_status: 'paid',
              payment_method: 'mercadopago',
              payment_id: paymentId,
              updated_at: new Date().toISOString(),
              start_date: new Date().toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0]
            })
            .match({
              user_id: userId,
              plan_id: planId,
              status: 'pending'
            })
            
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
          .eq('event_id', eventId)
          
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
          .eq('event_id', eventId)
          
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
        headers: corsHeaders
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
        headers: corsHeaders
      }
    )
  }
})
