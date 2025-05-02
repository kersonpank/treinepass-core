
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
    const accessToken = process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ 
        message: 'MercadoPago access token not configured'
      });
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken
    });

    const payment = new Payment(client);
    const paymentData = req.body;
    
    // Extract metadata
    const userId = paymentData.metadata?.user_id;
    const planId = paymentData.metadata?.plan_id;
    const planName = paymentData.metadata?.plan_name;

    if (!userId || !planId) {
      return res.status(400).json({ message: 'Missing required metadata (user_id or plan_id)' });
    }

    // Create payment
    const result = await payment.create({
      body: {
        transaction_amount: Number(paymentData.transaction_amount),
        description: paymentData.description || `Assinatura do plano ${planName || ''}`,
        payment_method_id: paymentData.payment_method_id,
        payer: paymentData.payer,
      },
    });

    // Save payment record in database
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        external_id: result.id.toString(),
        user_id: userId,
        amount: result.transaction_amount,
        payment_method: result.payment_method_id,
        status: result.status,
        metadata: {
          plan_id: planId,
          payment_details: result,
        },
      });

    if (paymentError) {
      console.error('Error saving payment record:', paymentError);
      // Continue execution even if the database save fails
    }

    // If payment is successful, update or create subscription
    if (result.status === 'approved') {
      // Cancel any pending subscriptions for this user
      const { error: cancelError } = await supabase
        .from('user_plan_subscriptions')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (cancelError) {
        console.error('Error cancelling pending subscriptions:', cancelError);
      }

      // Create/update subscription
      const { error: subscriptionError } = await supabase
        .from('user_plan_subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          payment_status: 'paid',
          payment_method: 'mercadopago',
          payment_id: result.id.toString(),
          start_date: new Date().toISOString().split('T')[0],
          total_value: result.transaction_amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
      }
    }

    // Return successful response
    return res.status(200).json({ 
      success: true, 
      payment: result,
      status: result.status
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ 
      message: 'Payment processing failed', 
      error: error.message || 'Unknown error'
    });
  }
}
