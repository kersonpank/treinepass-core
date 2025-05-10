
import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { payment_id } = req.query;

  if (!payment_id) {
    return res.status(400).json({ message: 'Payment ID is required' });
  }

  try {
    // First check in our database
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', payment_id)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Error retrieving payment from database', error: dbError });
    }

    // If we have the payment in our database, return it
    if (paymentRecord) {
      return res.status(200).json(paymentRecord);
    }

    // If not found in our database, check with Mercado Pago API
    const accessToken = process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ message: 'Mercado Pago access token not configured' });
    }
    
    const client = new MercadoPagoConfig({
      accessToken
    });
    
    const payment = new Payment(client);
    
    // Get payment details from Mercado Pago
    const mercadopagoPayment = await payment.get({
      id: payment_id as string,
    });
    
    // Store this payment in our database
    const { error: saveError } = await supabase
      .from('payments')
      .insert({
        external_id: payment_id,
        status: mercadopagoPayment.status,
        amount: mercadopagoPayment.transaction_amount,
        payment_method: mercadopagoPayment.payment_method_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: mercadopagoPayment
      });
      
    if (saveError) {
      console.error('Error saving payment data:', saveError);
    }
    
    // Return the payment data
    return res.status(200).json({
      external_id: payment_id,
      status: mercadopagoPayment.status,
      amount: mercadopagoPayment.transaction_amount,
      payment_method: mercadopagoPayment.payment_method_id
    });
    
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      message: 'Error verifying payment',
      error: error.message || 'Unknown error'
    });
  }
}
