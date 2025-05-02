
// Serviço para integração com o Mercado Pago
import { supabase } from '@/integrations/supabase/client';

// Constantes
export const MP_PUBLIC_KEY = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';
export const MP_ACCESS_TOKEN = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '';

// Tipos
export interface MercadoPagoCardFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  metadata?: Record<string, any>;
}

export interface MercadoPagoPaymentResponse {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  payment_method_id: string;
}

// Função para processar pagamento com cartão
export async function processMercadoPagoCardPayment(paymentData: MercadoPagoCardFormData): Promise<any> {
  try {
    console.log('[MercadoPagoService] Processing payment:', paymentData);
    
    const response = await fetch('/api/mercadopago/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao processar pagamento');
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('[MercadoPagoService] Payment processing error:', error);
    throw error;
  }
}

// Função para atualizar status de assinatura após pagamento bem-sucedido
export async function updateSubscriptionAfterPayment(
  userId: string, 
  planId: string, 
  paymentId: string, 
  amount: number
): Promise<void> {
  try {
    console.log('[MercadoPagoService] Updating subscription:', { userId, planId, paymentId });
    
    // 1. Cancelar assinaturas pendentes
    const { error: cancelError } = await supabase
      .from('user_plan_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'pending');
      
    if (cancelError) {
      console.error('[MercadoPagoService] Error canceling pending subscriptions:', cancelError);
    }
    
    // 2. Criar/atualizar assinatura
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
      });
      
    if (subscriptionError) {
      console.error('[MercadoPagoService] Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }
    
    console.log('[MercadoPagoService] Subscription updated successfully');
  } catch (error) {
    console.error('[MercadoPagoService] Database error:', error);
    throw error;
  }
}

// Função para carregar o SDK do Mercado Pago
export function loadMercadoPagoSDK(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).MercadoPago) {
      console.log('MercadoPago SDK already loaded');
      resolve();
      return;
    }
    
    console.log('Loading MercadoPago SDK...');
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      console.log('MercadoPago SDK loaded successfully');
      resolve();
    };
    script.onerror = (error) => {
      console.error('Error loading MercadoPago SDK:', error);
      reject(error);
    };
    document.body.appendChild(script);
  });
}

// Inicializar Mercado Pago
export function initializeMercadoPago(): any {
  if (!MP_PUBLIC_KEY) {
    throw new Error('MercadoPago Public Key não configurada');
  }
  
  if (typeof window === 'undefined') {
    return null;
  }
  
  return new (window as any).MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
}
