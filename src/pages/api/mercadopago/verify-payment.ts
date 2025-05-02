
import { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { payment_id } = req.query;
    
    if (!payment_id) {
      return res.status(400).json({
        message: 'Missing payment_id parameter',
      });
    }
    
    // Buscar no banco de dados primeiro
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', payment_id)
      .single();
      
    if (dbError) {
      console.error('Error fetching payment from database:', dbError);
      
      // Se não encontrou no banco, buscar diretamente no Mercado Pago
      const accessToken = process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
      
      if (!accessToken) {
        return res.status(500).json({ 
          message: 'Mercado Pago access token not configured' 
        });
      }
      
      const client = new MercadoPagoConfig({
        accessToken
      });
      
      const payment = new Payment(client);
      const paymentData = await payment.get({
        id: payment_id as string,
      });
      
      // Criar um registro no banco se ele não existir
      const { error: createError } = await supabase
        .from('payments')
        .insert({
          external_id: payment_id as string,
          status: paymentData.status,
          amount: paymentData.transaction_amount,
          payment_method: paymentData.payment_method_id,
          metadata: paymentData,
        });
        
      if (createError) {
        console.error('Error creating payment record:', createError);
      }
      
      return res.status(200).json({
        payment_id: payment_id,
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        payment_method: paymentData.payment_method_id,
      });
    }
    
    // Se encontrou no banco, retornar os dados
    return res.status(200).json({
      payment_id: paymentRecord.external_id,
      status: paymentRecord.status,
      amount: paymentRecord.amount,
      payment_method: paymentRecord.payment_method,
      user_id: paymentRecord.user_id,
      metadata: paymentRecord.metadata,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      message: 'Failed to verify payment',
      error: error.message || 'Unknown error'
    });
  }
}
