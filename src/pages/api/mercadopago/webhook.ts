
import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract webhook data
    const { id, topic, type } = req.query;
    
    // Log webhook receipt
    console.log('Received Mercado Pago webhook:', { id, topic, type });
    
    // Record webhook event
    const { error: logError } = await supabase
      .from('mercadopago_webhook_events')
      .insert({
        event_id: id as string,
        event_type: (topic || type) as string,
        payload: req.body,
        processed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging webhook event:', logError);
    }
    
    // If it's not a payment notification, acknowledge and exit early
    if (topic !== 'payment' && type !== 'payment') {
      return res.status(200).json({ message: 'Event received but not processed (not a payment event)' });
    }
    
    // Get payment details from Mercado Pago
    const accessToken = process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ message: 'Mercado Pago access token not configured' });
    }
    
    // Initialize Mercado Pago client
    const client = new MercadoPagoConfig({
      accessToken
    });
    
    // Get payment details
    const payment = new Payment(client);
    const paymentId = id as string;
    
    // Fetch payment details from Mercado Pago
    const paymentData = await payment.get({
      id: paymentId,
    });
    
    // Update payment record in our database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentData.status,
        updated_at: new Date().toISOString(),
        metadata: {
          ...paymentData,
        },
      })
      .eq('external_id', paymentId);

    if (updateError) {
      console.error('Error updating payment record:', updateError);
    }
    
    // If payment is approved, update the subscription
    if (paymentData.status === 'approved') {
      // Find the payment record to get user_id and plan_id
      const { data: payment, error: findError } = await supabase
        .from('payments')
        .select('user_id, metadata')
        .eq('external_id', paymentId)
        .single();
      
      if (findError) {
        console.error('Error finding payment record:', findError);
      } else if (payment) {
        const userId = payment.user_id;
        const planId = payment.metadata?.plan_id;
        
        if (userId && planId) {
          // Update subscription status
          const { error: subscriptionError } = await supabase
            .from('user_plan_subscriptions')
            .update({
              status: 'active',
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('plan_id', planId);
          
          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
          }
        }
      }
    }
    
    // Acknowledge receipt of the webhook
    return res.status(200).json({ success: true });
    
  } catch (error: any) {
    console.error('Error processing Mercado Pago webhook:', error);
    return res.status(500).json({
      message: 'Error processing webhook',
      error: error.message || 'Unknown error'
    });
  }
}
