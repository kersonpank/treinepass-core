
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
    console.log('[MercadoPago] Received webhook:', { id, topic, type, body: req.body });
    
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
      console.error('[MercadoPago] Error logging webhook event:', logError);
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
    
    console.log('[MercadoPago] Payment data:', paymentData);
    
    // Extract external reference which contains user_id and plan_id
    const externalReference = paymentData.external_reference;
    let userId = null;
    let planId = null;
    
    if (externalReference && externalReference.includes('plan_') && externalReference.includes('user_')) {
      try {
        // Format should be plan_PLANID_user_USERID
        const parts = externalReference.split('_');
        if (parts.length >= 4) {
          planId = parts[1];
          userId = parts[3];
        }
      } catch (e) {
        console.error('[MercadoPago] Error parsing external reference:', e);
      }
    }
    
    console.log('[MercadoPago] Extracted data:', { userId, planId });
    
    // Update payment record in our database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentData.status,
        updated_at: new Date().toISOString(),
        metadata: {
          ...paymentData,
          webhook_processed_at: new Date().toISOString(),
        },
      })
      .eq('external_id', paymentId);

    if (updateError) {
      console.error('[MercadoPago] Error updating payment record:', updateError);
    }
    
    // If payment is approved, update the subscription
    if (paymentData.status === 'approved' && userId && planId) {
      // Update the user's subscription
      const { error: subscriptionError } = await supabase
        .from('user_plan_subscriptions')
        .update({
          status: 'active',
          payment_status: 'paid',
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('plan_id', planId)
        .eq('status', 'pending');
      
      if (subscriptionError) {
        console.error('[MercadoPago] Error updating subscription:', subscriptionError);
        return res.status(500).json({ 
          message: 'Error updating subscription',
          error: subscriptionError
        });
      }
      
      console.log('[MercadoPago] Subscription activated successfully');
    }
    
    // Acknowledge receipt of the webhook
    return res.status(200).json({ success: true });
    
  } catch (error: any) {
    console.error('[MercadoPago] Error processing webhook:', error);
    return res.status(500).json({
      message: 'Error processing webhook',
      error: error.message || 'Unknown error'
    });
  }
}
