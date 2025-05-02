
import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const payment = new Payment(client);
    const paymentData = req.body;
    const userId = req.body.metadata?.user_id;
    const planId = req.body.metadata?.plan_id;

    // Criar pagamento no Mercado Pago
    const result = await payment.create({
      body: {
        ...paymentData,
        transaction_amount: Number(paymentData.transaction_amount),
        description: paymentData.description || 'Assinatura TreinePass',
        payment_method_id: paymentData.payment_method_id,
        payer: paymentData.payer,
      },
    });

    // Salvar no banco de dados
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        external_id: result.id,
        status: result.status,
        amount: result.transaction_amount,
        payment_method: result.payment_method_id,
        user_id: userId,
        metadata: {
          plan_id: planId,
          payment_details: result,
        },
      });

    if (paymentError) {
      console.error('Error saving payment:', paymentError);
      return res.status(500).json({ message: 'Database error', error: paymentError });
    }

    // Se o pagamento foi aprovado, atualizar a assinatura
    if (result.status === 'approved' && userId && planId) {
      // Cancelar assinaturas pendentes anteriores
      const { error: cancelError } = await supabase
        .from('user_plan_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (cancelError) {
        console.error('Error cancelling pending subscriptions:', cancelError);
      }

      // Criar ou atualizar a assinatura
      const { error: subscriptionError } = await supabase
        .from('user_plan_subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          payment_status: 'paid',
          payment_method: 'mercadopago',
          payment_id: result.id,
          total_value: result.transaction_amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return res.status(500).json({ message: 'Subscription update error', error: subscriptionError });
      }
    }

    return res.status(200).json({ success: true, payment: result });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ 
      message: 'Payment failed', 
      error: error.message || 'Unknown error' 
    });
  }
}
