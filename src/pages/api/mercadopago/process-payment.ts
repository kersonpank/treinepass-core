
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const paymentData = req.body;
    const userId = paymentData.metadata?.user_id;
    const planId = paymentData.metadata?.plan_id;
    const subscriptionId = paymentData.metadata?.subscription_id;

    console.log('[MercadoPago] Processing payment:', {
      amount: paymentData.transaction_amount,
      userId,
      planId,
      subscriptionId
    });

    // Em um ambiente de produção, você comunicaria com a API do Mercado Pago.
    // Para fins de demonstração, simularemos um pagamento bem-sucedido.
    const paymentResult = {
      id: `test_${Math.random().toString(36).substring(2, 15)}`,
      status: 'approved',
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
    };

    // Salvar no banco de dados
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        external_id: paymentResult.id,
        status: paymentResult.status,
        amount: paymentResult.transaction_amount,
        payment_method: paymentResult.payment_method_id,
        user_id: userId,
        metadata: {
          plan_id: planId,
          subscription_id: subscriptionId,
          payment_details: paymentResult,
        },
      });

    if (paymentError) {
      console.error('Error saving payment:', paymentError);
      return res.status(500).json({ message: 'Database error', error: paymentError });
    }

    // Se o pagamento foi aprovado, atualizar a assinatura
    if (paymentResult.status === 'approved' && userId && planId && subscriptionId) {
      // Cancelar assinaturas pendentes anteriores
      const { error: cancelError } = await supabase
        .from('user_plan_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', userId)
        .neq('id', subscriptionId)
        .eq('status', 'pending');

      if (cancelError) {
        console.error('Error cancelling pending subscriptions:', cancelError);
      }

      // Atualizar a assinatura atual
      const { error: subscriptionError } = await supabase
        .from('user_plan_subscriptions')
        .update({
          status: 'active',
          payment_status: 'paid',
          payment_method: 'mercadopago',
          payment_id: paymentResult.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return res.status(500).json({ message: 'Subscription update error', error: subscriptionError });
      }
    }

    return res.status(200).json({ success: true, payment: paymentResult });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ 
      message: 'Payment failed', 
      error: error.message || 'Unknown error' 
    });
  }
}
