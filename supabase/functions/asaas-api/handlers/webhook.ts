/**
 * Handler para processar webhooks do Asaas
 * Documentação: https://docs.asaas.com/docs/webhook-para-assinaturas
 */

export async function handleWebhook(event: any, apiKey: string, baseUrl: string, supabase: any) {
  console.log("Recebendo webhook do Asaas:", event);
  
  if (!event || !event.event) {
    throw new Error("Evento de webhook inválido");
  }
  
  // Extrair informações do evento
  const eventType = event.event;
  const payment = event.payment;
  const subscription = event.subscription;
  
  console.log(`Processando evento ${eventType} para assinatura ${subscription?.id} e pagamento ${payment?.id}`);
  
  // Verificar se a assinatura existe no banco de dados
  // Primeiro, verificar se existe nas assinaturas de usuário
  let subscriptionRecord;
  let isBusinessSubscription = false;
  
  // Para pagamentos de checkout direto, o external_reference está no payment
  // Para assinaturas tradicionais, o external_reference seria o subscription?.id
  const externalRef = payment?.externalReference || subscription?.id;
  
  console.log(`Buscando assinatura com external_reference: ${externalRef}`);
  
  // Buscar pelo external_reference nas tabelas de assinatura
  const { data: userSubscription } = await supabase
    .from('subscriptions')  // Nova tabela unificada
    .select('*')
    .eq('external_reference', externalRef)
    .maybeSingle();
    
  if (!userSubscription) {
    // Tentar buscar na tabela user_plan_subscriptions (legado)
    const { data: legacySubscription } = await supabase
      .from('user_plan_subscriptions')
      .select('*')
      .eq('external_reference', externalRef)
      .maybeSingle();
      
    if (legacySubscription) {
      subscriptionRecord = legacySubscription;
    }
  } else {
    subscriptionRecord = userSubscription;
  }
  
  // Se ainda não encontramos na subscriptions ou user_plan_subscriptions, verificar nas assinaturas de empresa
  if (!subscriptionRecord) {
    const { data: businessSubscription } = await supabase
      .from('business_plan_subscriptions')
      .select('*')
      .eq('external_reference', externalRef)
      .maybeSingle();
    
    if (businessSubscription) {
      subscriptionRecord = businessSubscription;
      isBusinessSubscription = true;
    }
  }
  
  if (!subscriptionRecord) {
    console.log(`Assinatura ${subscription?.id} não encontrada no banco de dados`);
    return {
      success: false,
      message: `Assinatura ${subscription?.id} não encontrada no banco de dados`
    };
  }
  
  // Processar o evento com base no tipo
  switch (eventType) {
    case 'PAYMENT_RECEIVED':
      // Pagamento recebido - ativar assinatura
      return await handlePaymentReceived(subscriptionRecord, payment, isBusinessSubscription, supabase);
    
    case 'PAYMENT_OVERDUE':
      // Pagamento atrasado - marcar como pendente
      return await handlePaymentOverdue(subscriptionRecord, payment, isBusinessSubscription, supabase);
    
    case 'PAYMENT_CONFIRMED':
      // Pagamento confirmado - ativar assinatura
      return await handlePaymentConfirmed(subscriptionRecord, payment, isBusinessSubscription, supabase);
    
    case 'PAYMENT_RECEIVED_IN_CASH':
      // Pagamento recebido em dinheiro - ativar assinatura
      return await handlePaymentReceived(subscriptionRecord, payment, isBusinessSubscription, supabase);
    
    case 'PAYMENT_REFUNDED':
      // Pagamento estornado - cancelar assinatura
      return await handlePaymentRefunded(subscriptionRecord, payment, isBusinessSubscription, supabase);
    
    case 'PAYMENT_DELETED':
      // Pagamento deletado - não fazer nada
      return { success: true, message: 'Pagamento deletado' };
    
    case 'PAYMENT_UPDATED':
      // Pagamento atualizado - atualizar informações
      return await handlePaymentUpdated(subscriptionRecord, payment, isBusinessSubscription, supabase);
    
    case 'PAYMENT_ANTICIPATED':
      // Pagamento antecipado - atualizar data
      return await handlePaymentUpdated(subscriptionRecord, payment, isBusinessSubscription, supabase);
    
    case 'SUBSCRIPTION_CANCELLED':
      // Assinatura cancelada - cancelar assinatura
      return await handleSubscriptionCancelled(subscriptionRecord, subscription, isBusinessSubscription, supabase);
    
    default:
      console.log(`Evento ${eventType} não processado`);
      return { success: true, message: `Evento ${eventType} não processado` };
  }
}

// Handlers para cada tipo de evento
async function handlePaymentReceived(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any) {
  const table = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
  // Atualizar status da assinatura atual
  const { error } = await supabase
    .from(table)
    .update({
      payment_status: 'paid',
      status: 'active',
      last_payment_date: new Date().toISOString(),
      next_payment_date: payment.dueDate || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);
  if (error) {
    console.error(`Erro ao atualizar assinatura após pagamento recebido:`, error);
    return { success: false, error };
  }

  // Cancelar todas as outras assinaturas pendentes do mesmo usuário/empresa
  const userField = isBusinessSubscription ? 'business_id' : 'user_id';
  const userId = subscription[userField];
  const { error: cancelError } = await supabase
    .from(table)
    .update({
      status: 'cancelled',
      payment_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq(userField, userId)
    .neq('id', subscription.id)
    .in('status', ['pending', 'active']); // Cancela pendentes e ativas antigas
  if (cancelError) {
    console.error('Erro ao cancelar assinaturas pendentes/antigas:', cancelError);
  }

  // Registrar o pagamento no histórico
  const { error: historyError } = await supabase
    .from('payment_history')
    .insert({
      subscription_id: subscription.id,
      is_business: isBusinessSubscription,
      payment_id: payment.id,
      value: payment.value,
      payment_date: payment.paymentDate,
      payment_method: payment.billingType,
      status: 'paid',
      external_reference: payment.externalReference || null
    });
  if (historyError) {
    console.error(`Erro ao registrar histórico de pagamento:`, historyError);
  }

  return {
    success: true,
    message: 'Assinatura ativada e pendentes/antigas canceladas após pagamento'
  };
}

async function handlePaymentOverdue(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any) {
  const table = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
  
  // Atualizar status da assinatura
  const { error } = await supabase
    .from(table)
    .update({
      payment_status: 'overdue',
      status: 'pending', // Manter ativo, mas marcar como pendente
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);
  
  if (error) {
    console.error(`Erro ao atualizar assinatura após pagamento atrasado:`, error);
    return { success: false, error };
  }
  
  return {
    success: true,
    message: 'Assinatura marcada como pendente por pagamento atrasado'
  };
}

async function handlePaymentConfirmed(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any) {
  // Mesmo comportamento do pagamento recebido
  return await handlePaymentReceived(subscription, payment, isBusinessSubscription, supabase);
}

async function handlePaymentRefunded(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any) {
  const table = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
  
  // Atualizar status da assinatura
  const { error } = await supabase
    .from(table)
    .update({
      payment_status: 'refunded',
      status: 'inactive', // Desativar assinatura
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);
  
  if (error) {
    console.error(`Erro ao atualizar assinatura após estorno:`, error);
    return { success: false, error };
  }
  
  // Registrar o estorno no histórico
  const { error: historyError } = await supabase
    .from('payment_history')
    .insert({
      subscription_id: subscription.id,
      is_business: isBusinessSubscription,
      payment_id: payment.id,
      value: payment.value,
      payment_date: new Date().toISOString(),
      payment_method: payment.billingType,
      status: 'refunded',
      external_reference: payment.externalReference || null
    });
  
  if (historyError) {
    console.error(`Erro ao registrar histórico de estorno:`, historyError);
  }
  
  return {
    success: true,
    message: 'Assinatura desativada após estorno'
  };
}

async function handlePaymentUpdated(subscription: any, payment: any, isBusinessSubscription: boolean, supabase: any) {
  const table = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
  
  // Atualizar informações de pagamento
  const { error } = await supabase
    .from(table)
    .update({
      next_payment_date: payment.dueDate || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);
  
  if (error) {
    console.error(`Erro ao atualizar informações de pagamento:`, error);
    return { success: false, error };
  }
  
  return {
    success: true,
    message: 'Informações de pagamento atualizadas'
  };
}

async function handleSubscriptionCancelled(subscription: any, asaasSubscription: any, isBusinessSubscription: boolean, supabase: any) {
  const table = isBusinessSubscription ? 'business_plan_subscriptions' : 'user_plan_subscriptions';
  
  // Atualizar status da assinatura
  const { error } = await supabase
    .from(table)
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      cancelled_at: new Date().toISOString()
    })
    .eq('id', subscription.id);
  
  if (error) {
    console.error(`Erro ao cancelar assinatura:`, error);
    return { success: false, error };
  }
  
  return {
    success: true,
    message: 'Assinatura cancelada'
  };
}
