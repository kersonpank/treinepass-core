
import { supabase } from '@/integrations/supabase/client';

/**
 * Inicializa o Mercado Pago com a chave pública
 */
export function initializeMercadoPago() {
  const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error('Mercado Pago public key não encontrada');
  }
  
  if (typeof window === 'undefined' || !(window as any).MercadoPago) {
    throw new Error('Mercado Pago SDK não carregado');
  }
  
  return new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
}

/**
 * Cria um brick de pagamento com cartão
 */
export function createCardPaymentBrick(
  containerId: string,
  amount: number,
  options: {
    payerEmail?: string;
    metadata?: Record<string, any>;
    onReady?: () => void;
    onError?: (error: any) => void;
    onSubmit?: (formData: any) => Promise<boolean>;
  }
) {
  try {
    const mp = initializeMercadoPago();
    const brickBuilder = mp.bricks();
    
    brickBuilder.create('cardPayment', containerId, {
      initialization: {
        amount: amount.toString(),
        payer: options.payerEmail ? { email: options.payerEmail } : undefined,
      },
      customization: {
        visual: {
          hideFormTitle: true,
          hidePaymentButton: false,
        },
        paymentMethods: {
          maxInstallments: 12,
        },
      },
      callbacks: {
        onReady: () => {
          console.log('Brick pronto e renderizado');
          if (options.onReady) options.onReady();
        },
        onSubmit: options.onSubmit,
        onError: (error: any) => {
          console.error('Erro no Brick:', error);
          if (options.onError) options.onError(error);
        },
      },
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao criar brick de pagamento:', error);
    if (options.onError) options.onError(error);
    return false;
  }
}

/**
 * Processa pagamento com o Mercado Pago
 */
export async function processMercadoPagoPayment(
  formData: any,
  amount: number,
  metadata: Record<string, any> = {}
) {
  // Em uma implementação real, isso chamaria sua API de backend
  // Para fins de demonstração, estamos simulando um pagamento bem-sucedido
  console.log('[MercadoPagoService] Processando pagamento com valor:', amount);
  
  // Criar uma resposta simulada de sucesso
  const mockPaymentResponse = {
    success: true,
    payment: {
      id: "mp_" + Math.random().toString(36).substring(2),
      status: 'approved',
      transaction_amount: amount,
      payment_method_id: formData.payment_method_id || 'card',
      metadata
    }
  };

  return mockPaymentResponse;
}

/**
 * Atualiza a assinatura do usuário no banco de dados após pagamento bem-sucedido
 */
export async function updateSubscriptionAfterPayment(
  userId: string,
  planId: string,
  paymentId: string,
  amount: number
) {
  try {
    console.log('[MercadoPagoService] Atualizando assinatura para usuário:', userId);
    
    // 1. Cancelar assinaturas pendentes
    const { error: cancelError } = await supabase
      .from('user_plan_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'pending');
      
    if (cancelError) {
      console.error('[MercadoPagoService] Erro ao cancelar assinaturas pendentes:', cancelError);
    }
    
    // 2. Verificar assinaturas ativas (para cenário de upgrade)
    const { data: activeSubscription } = await supabase
      .from('user_plan_subscriptions')
      .select('id, plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    // Se estiver fazendo upgrade de um plano existente, cancelar assinatura anterior
    if (activeSubscription && activeSubscription.plan_id !== planId) {
      console.log('[MercadoPagoService] Fazendo upgrade do plano:', activeSubscription.plan_id);
      
      const { error: upgradeError } = await supabase
        .from('user_plan_subscriptions')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeSubscription.id);
        
      if (upgradeError) {
        console.error('[MercadoPagoService] Erro ao cancelar assinatura anterior:', upgradeError);
      }
    }
    
    // 3. Criar ou atualizar assinatura
    const { error: subscriptionError } = await supabase
      .from('user_plan_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        payment_status: 'paid',
        payment_method: 'mercadopago',
        payment_id: paymentId,
        total_value: amount,
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        upgrade_from_subscription_id: activeSubscription?.id || null
      });
      
    if (subscriptionError) {
      console.error('[MercadoPagoService] Erro ao criar assinatura:', subscriptionError);
      throw subscriptionError;
    }
    
    return true;
  } catch (error) {
    console.error('[MercadoPagoService] Erro em updateSubscriptionAfterPayment:', error);
    throw error;
  }
}
