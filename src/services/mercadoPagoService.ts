
import { supabase } from '@/integrations/supabase/client';

/**
 * Initialize Mercado Pago with public key
 */
export function initializeMercadoPago() {
  const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error('Mercado Pago public key not found');
  }
  
  if (typeof window === 'undefined' || !(window as any).MercadoPago) {
    throw new Error('Mercado Pago SDK not loaded');
  }
  
  return new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
}

/**
 * Create a card payment brick
 */
export async function createCardPaymentBrick(
  containerId: string,
  amount: number,
  options: {
    payerEmail?: string;
    metadata?: Record<string, any>;
    onReady?: () => void;
    onError?: (error: any) => void;
    onSubmit?: (data: any) => Promise<boolean>;
  }
) {
  try {
    const mp = initializeMercadoPago();
    const brickBuilder = mp.bricks();
    
    await brickBuilder.create('cardPayment', containerId, {
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
          console.log('Brick ready and rendered');
          if (options.onReady) options.onReady();
        },
        onSubmit: options.onSubmit,
        onError: (error: any) => {
          console.error('Brick error:', error);
          if (options.onError) options.onError(error);
        },
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error creating card payment brick:', error);
    if (options.onError) options.onError(error);
    return false;
  }
}

/**
 * Process payment with Mercado Pago
 */
export async function processMercadoPagoPayment(
  formData: any,
  amount: number,
  metadata: Record<string, any> = {}
) {
  // In a real implementation, this would call your backend API
  // For demo purposes, we're simulating a successful payment
  console.log('[MercadoPagoService] Processing payment with amount:', amount);
  
  // Create a mock successful response
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
 * Update user subscription in database after successful payment
 */
export async function updateSubscriptionAfterPayment(
  userId: string,
  planId: string,
  paymentId: string,
  amount: number
) {
  try {
    console.log('[MercadoPagoService] Updating subscription for user:', userId);
    
    // 1. Cancel pending subscriptions
    const { error: cancelError } = await supabase
      .from('user_plan_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'pending');
      
    if (cancelError) {
      console.error('[MercadoPagoService] Error cancelling pending subscriptions:', cancelError);
    }
    
    // 2. Check for active subscriptions (for upgrade scenario)
    const { data: activeSubscription } = await supabase
      .from('user_plan_subscriptions')
      .select('id, plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    // If upgrading from an existing plan, cancel previous subscription
    if (activeSubscription && activeSubscription.plan_id !== planId) {
      console.log('[MercadoPagoService] Upgrading from plan:', activeSubscription.plan_id);
      
      const { error: upgradeError } = await supabase
        .from('user_plan_subscriptions')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeSubscription.id);
        
      if (upgradeError) {
        console.error('[MercadoPagoService] Error cancelling previous subscription:', upgradeError);
      }
    }
    
    // 3. Create or update subscription
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
      console.error('[MercadoPagoService] Error creating subscription:', subscriptionError);
      throw subscriptionError;
    }
    
    return true;
  } catch (error) {
    console.error('[MercadoPagoService] Error in updateSubscriptionAfterPayment:', error);
    throw error;
  }
}
