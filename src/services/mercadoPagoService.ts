
import { supabase } from '@/integrations/supabase/client';

/**
 * Cria um brick de pagamento com cartão
 */
export function createCardPaymentBrick(
  mercadoPago: any,
  containerId: string,
  amount: number,
  options: {
    payerEmail?: string;
    metadata?: Record<string, any>;
    onReady?: () => void;
    onError?: (error: any) => void;
    onSubmit?: (formData: any) => Promise<any>;
  }
) {
  if (!mercadoPago) {
    console.error('Mercado Pago não inicializado');
    return false;
  }
  
  try {
    console.log(`Criando brick de pagamento para ${containerId} com valor ${amount}`);
    const brickBuilder = mercadoPago.bricks();
    
    // Limpar container
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
    
    brickBuilder.create('payment', containerId, {
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
        onSubmit: async (formData: any) => {
          console.log('Formulário enviado:', formData);
          
          try {
            // Adicionar metadados ao payload
            const dataWithMetadata = {
              ...formData,
              metadata: options.metadata || {},
            };
            
            if (options.onSubmit) {
              const result = await options.onSubmit(dataWithMetadata);
              return result;
            }
            
            return true;
          } catch (error) {
            console.error('Erro no envio:', error);
            if (options.onError) options.onError(error);
            return false;
          }
        },
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
  console.log('[MercadoPagoService] Processando pagamento com valor:', amount);
  
  try {
    // Em uma implementação real, usar endpoint para processar pagamento
    // Para fins de demonstração/teste, simularemos um pagamento bem-sucedido
    
    // Se tivermos um endpoint de API para processar o pagamento
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      const response = await fetch('/api/mercadopago/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          transaction_amount: amount,
          metadata,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar pagamento');
      }
      
      return await response.json();
    } else {
      // Simular resposta de pagamento para ambiente de desenvolvimento
      return {
        success: true,
        payment: {
          id: "test_" + Math.random().toString(36).substring(2),
          status: 'approved',
          transaction_amount: amount,
          payment_method_id: formData.payment_method_id || 'card',
          metadata
        }
      };
    }
  } catch (error) {
    console.error('[MercadoPagoService] Erro ao processar pagamento:', error);
    throw error;
  }
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
      .update({ 
        status: 'cancelled', 
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()  
      })
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
    const today = new Date().toISOString().split('T')[0];
    // Definir data de término 1 ano no futuro
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
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
        start_date: today,
        end_date: endDate.toISOString().split('T')[0],
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
