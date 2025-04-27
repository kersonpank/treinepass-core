/**
 * Handler para webhooks do Asaas usando o SDK
 */
import { getAsaasClient } from '../sdk-config.ts';

/**
 * Processa eventos de webhook do Asaas
 */
export async function handleWebhook(event: any, apiKey: string, baseUrl: string, supabase: any) {
  console.log("Processando webhook do Asaas:", event);
  
  if (!event || !event.event) {
    throw new Error("Evento de webhook invu00e1lido");
  }
  
  try {
    // Salvar o evento no banco de dados para auditoria e reprocessamento se necessu00e1rio
    const eventId = event.payment?.id || event.subscription?.id || event.id || `event_${Date.now()}`;
    
    // Salvar o evento completo na tabela asaas_webhook_events
    await supabase
      .from('asaas_webhook_events')
      .insert({
        event_id: eventId,
        event_type: event.event,
        event_data: event,
        processed: false,
        processing_attempts: 0
      });
    
    // Extrair informau00e7u00f5es do evento
    const eventType = event.event;
    const payment = event.payment;
    const subscription = event.subscription;
    
    // Para pagamentos de checkout direto, o external_reference estu00e1 no payment
    // Para assinaturas tradicionais, o external_reference seria o subscription?.id
    const externalRef = payment?.externalReference || subscription?.id;
    
    console.log(`Processando evento ${eventType} para referência externa ${externalRef}`);
    
    // Buscar pelo external_reference nas tabelas de assinatura
    const { data: subscriptionRecord } = await supabase
      .from('subscriptions')  // Nova tabela unificada
      .select('*')
      .eq('external_reference', externalRef)
      .maybeSingle();
    
    // Se não encontrar na tabela unificada, tentar nas tabelas legadas
    let isBusinessSubscription = false;
    let finalRecord = subscriptionRecord;
    
    if (!finalRecord) {
      // Tentar buscar na tabela user_plan_subscriptions (legado)
      const { data: legacyUserSubscription } = await supabase
        .from('user_plan_subscriptions')
        .select('*')
        .eq('external_reference', externalRef)
        .maybeSingle();
      
      if (legacyUserSubscription) {
        finalRecord = legacyUserSubscription;
      } else {
        // Tentar buscar na tabela business_plan_subscriptions (legado)
        const { data: legacyBusinessSubscription } = await supabase
          .from('business_plan_subscriptions')
          .select('*')
          .eq('external_reference', externalRef)
          .maybeSingle();
        
        if (legacyBusinessSubscription) {
          finalRecord = legacyBusinessSubscription;
          isBusinessSubscription = true;
        }
      }
    }
    
    if (!finalRecord) {
      console.log(`Nenhuma assinatura encontrada para a referu00eancia externa ${externalRef}`);
      // Atualizar o registro de evento como processado com erro
      await supabase
        .from('asaas_webhook_events')
        .update({
          processed: true,
          processing_error: `Nenhuma assinatura encontrada para a referu00eancia externa ${externalRef}`,
          processed_at: new Date().toISOString()
        })
        .eq('event_id', eventId);
      
      return { success: false, error: 'Subscription not found' };
    }
    
    // Processar o evento baseado no tipo
    let result;
    switch (eventType) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        result = await handlePaymentReceived(subscription, payment, isBusinessSubscription, supabase, finalRecord);
        break;
      
      case 'PAYMENT_OVERDUE':
        result = await handlePaymentOverdue(subscription, payment, isBusinessSubscription, supabase, finalRecord);
        break;
      
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_REFUND_CONFIRMED':
        result = await handlePaymentRefunded(subscription, payment, isBusinessSubscription, supabase, finalRecord);
        break;
      
      case 'PAYMENT_CREATED':
      case 'PAYMENT_UPDATED':
        result = await handlePaymentUpdated(subscription, payment, isBusinessSubscription, supabase, finalRecord);
        break;
      
      case 'SUBSCRIPTION_CANCELLED':
        // Obter dados da assinatura via SDK para ter informações completas
        const asaas = getAsaasClient(apiKey, baseUrl.includes('api.asaas.com'));
        const asaasSubscription = await asaas.retrieveSingleSubscription({
          id: subscription.id
        });
        result = await handleSubscriptionCancelled(subscription, asaasSubscription, isBusinessSubscription, supabase, finalRecord);
        break;
      
      default:
        console.log(`Evento ${eventType} nu00e3o processado`);
        result = { success: true, message: `Event type ${eventType} not handled` };
    }
    
    // Atualizar o registro de evento como processado
    await supabase
      .from('asaas_webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        processing_result: result
      })
      .eq('event_id', eventId);
    
    return result;
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    
    // Tentar atualizar o registro de evento com o erro
    try {
      const eventId = event.payment?.id || event.subscription?.id || event.id || `event_${Date.now()}`;
      await supabase
        .from('asaas_webhook_events')
        .update({
          processing_attempts: supabase.raw('processing_attempts + 1'),
          processing_error: error.message || 'Unknown error',
          last_error_at: new Date().toISOString()
        })
        .eq('event_id', eventId);
    } catch (dbError) {
      console.error('Erro ao atualizar registro de evento:', dbError);
    }
    
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Manipula evento de pagamento recebido/confirmado
 */
async function handlePaymentReceived(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any, record: any) {
  console.log(`Processando pagamento recebido para ${isBusinessSubscription ? 'empresa' : 'usuu00e1rio'}`, payment);
  
  try {
    const tableName = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
    const unifiedTable = 'subscriptions';
    
    // Verificar se devemos usar a tabela unificada ou legacy
    const table = record.hasOwnProperty('subscription_type') ? unifiedTable : tableName;
    
    // Atualizar status da assinatura para ativo
    await supabase
      .from(table)
      .update({
        status: 'active',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);
    
    // Atualizar informações de pagamento, se disponíveis
    if (payment) {
      await supabase
        .from(table)
        .update({
          asaas_payment_id: payment.id,
          payment_date: payment.paymentDate || payment.confirmedDate,
          payment_method: payment.billingType,
          last_payment_date: payment.confirmedDate || payment.paymentDate || new Date().toISOString()
        })
        .eq('id', record.id);
    }
    
    // IMPORTANTE: Cancelar todas as outras assinaturas pendentes para o mesmo usuário
    // conforme as memórias, um usuário só pode ter uma assinatura ativa por vez
    if (table === 'user_plan_subscriptions' || (table === unifiedTable && !isBusinessSubscription)) {
      await supabase
        .from(table)
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', record.user_id)
        .neq('id', record.id)
        .in('status', ['pending', 'waiting_payment']);
    }
    
    return { 
      success: true, 
      message: 'Subscription activated successfully',
      record: record.id
    };
  } catch (error: any) {
    console.error('Erro ao processar pagamento recebido:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manipula evento de pagamento em atraso
 */
async function handlePaymentOverdue(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any, record: any) {
  console.log(`Processando pagamento em atraso para ${isBusinessSubscription ? 'empresa' : 'usuu00e1rio'}`, payment);
  
  try {
    const tableName = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
    const unifiedTable = 'subscriptions';
    
    // Verificar se devemos usar a tabela unificada ou legacy
    const table = record.hasOwnProperty('subscription_type') ? unifiedTable : tableName;
    
    // Atualizar status da assinatura
    await supabase
      .from(table)
      .update({
        status: 'overdue',
        payment_status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);
    
    return { 
      success: true, 
      message: 'Subscription marked as overdue',
      record: record.id
    };
  } catch (error: any) {
    console.error('Erro ao processar pagamento em atraso:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manipula evento de pagamento reembolsado
 */
async function handlePaymentRefunded(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any, record: any) {
  console.log(`Processando reembolso para ${isBusinessSubscription ? 'empresa' : 'usuu00e1rio'}`, payment);
  
  try {
    const tableName = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
    const unifiedTable = 'subscriptions';
    
    // Verificar se devemos usar a tabela unificada ou legacy
    const table = record.hasOwnProperty('subscription_type') ? unifiedTable : tableName;
    
    // Atualizar status da assinatura
    await supabase
      .from(table)
      .update({
        status: 'refunded',
        payment_status: 'refunded',
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);
    
    return { 
      success: true, 
      message: 'Subscription marked as refunded',
      record: record.id
    };
  } catch (error: any) {
    console.error('Erro ao processar reembolso:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manipula evento de pagamento atualizado
 */
async function handlePaymentUpdated(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any, record: any) {
  console.log(`Processando atualizau00e7u00e3o de pagamento para ${isBusinessSubscription ? 'empresa' : 'usuu00e1rio'}`, payment);
  
  try {
    const tableName = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
    const unifiedTable = 'subscriptions';
    
    // Verificar se devemos usar a tabela unificada ou legacy
    const table = record.hasOwnProperty('subscription_type') ? unifiedTable : tableName;
    
    // Atualizar informações de pagamento
    await supabase
      .from(table)
      .update({
        payment_status: payment.status,
        payment_method: payment.billingType,
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);
    
    return { 
      success: true, 
      message: 'Payment information updated',
      record: record.id
    };
  } catch (error: any) {
    console.error('Erro ao atualizar informau00e7u00f5es de pagamento:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manipula evento de assinatura cancelada
 */
async function handleSubscriptionCancelled(subscription: any, asaasSubscription: any, isBusinessSubscription: boolean, supabase: any, record: any) {
  console.log(`Processando cancelamento de assinatura para ${isBusinessSubscription ? 'empresa' : 'usuu00e1rio'}`, subscription);
  
  try {
    const tableName = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
    const unifiedTable = 'subscriptions';
    
    // Verificar se devemos usar a tabela unificada ou legacy
    const table = record.hasOwnProperty('subscription_type') ? unifiedTable : tableName;
    
    // Atualizar status da assinatura
    await supabase
      .from(table)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);
    
    return { 
      success: true, 
      message: 'Subscription cancelled successfully',
      record: record.id
    };
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    return { success: false, error: error.message };
  }
}
