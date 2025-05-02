import { NextApiRequest, NextApiResponse } from 'next';
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
    // Extrair dados do webhook
    const { id, topic } = req.query;
    
    if (topic !== 'payment') {
      return res.status(200).json({ message: 'Ignored non-payment webhook' });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const payment = new Payment(client);
    const paymentId = id as string;

    // Buscar detalhes do pagamento
    const paymentDetails = await payment.get({
      id: paymentId,
    });

    // Registrar evento do webhook
    const { error: logError } = await supabase
      .from('mercadopago_webhook_events')
      .insert({
        event_id: paymentId,
        event_type: topic as string,
        payload: req.body,
        processed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging webhook event:', logError);
    }

    // Atualizar status do pagamento
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentDetails.status,
        updated_at: new Date().toISOString(),
        metadata: {
          ...paymentDetails,
        },
      })
      .eq('external_id', paymentId);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return res.status(500).json({ message: 'Database error' });
    }

    // Se o pagamento foi aprovado, atualizar a assinatura
    if (paymentDetails.status === 'approved') {
      // Buscar o pagamento para obter o user_id e plan_id
      const { data: paymentData } = await supabase
        .from('payments')
        .select('metadata')
        .eq('external_id', paymentId)
        .single();

      if (paymentData?.metadata) {
        const userId = paymentData.metadata.user_id;
        const planId = paymentData.metadata.plan_id;

        if (userId && planId) {
          // Cancelar assinaturas pendentes anteriores
          const { error: cancelError } = await supabase
            .from('user_plan_subscriptions')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('status', 'pending');

          if (cancelError) {
            console.error('Error cancelling pending subscriptions:', cancelError);
          }

          // Atualizar a assinatura para ativa
          const { error: subscriptionError } = await supabase
            .from('user_plan_subscriptions')
            .update({
              status: 'active',
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('plan_id', planId)
            .eq('payment_id', paymentId);

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
          }
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
