
import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { payment_id } = req.query;
    
    if (!payment_id) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    const accessToken = process.env.NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ message: 'MercadoPago access token not configured' });
    }

    // Verificar se já temos esse pagamento registrado
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', payment_id)
      .single();
    
    if (existingPayment) {
      return res.status(200).json({
        payment: existingPayment,
        status: existingPayment.status
      });
    }
    
    // Se não encontramos no banco, consultar diretamente na API do Mercado Pago
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    
    const paymentData = await payment.get({ id: payment_id as string });
    
    // Extrair referência externa para obter dados de user_id e plan_id
    let userId = null;
    let planId = null;
    
    if (paymentData.external_reference && 
        paymentData.external_reference.includes('plan_') && 
        paymentData.external_reference.includes('user_')) {
      const parts = paymentData.external_reference.split('_');
      if (parts.length >= 4) {
        planId = parts[1];
        userId = parts[3];
      }
    }
    
    // Registrar pagamento no banco de dados
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        external_id: payment_id,
        user_id: userId,
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        payment_method: paymentData.payment_method_id,
        metadata: {
          ...paymentData,
          plan_id: planId
        }
      });
      
    if (paymentError) {
      console.error('Error saving payment:', paymentError);
    }
    
    // Atualizar assinatura se pagamento aprovado
    if (paymentData.status === 'approved' && userId && planId) {
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      const { error: subscriptionError } = await supabase
        .from('user_plan_subscriptions')
        .update({
          status: 'active',
          payment_status: 'paid',
          payment_method: 'mercadopago',
          payment_id: payment_id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .match({
          user_id: userId,
          plan_id: planId,
          status: 'pending'
        });
        
      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
      }
    }
    
    return res.status(200).json({
      payment: paymentData,
      status: paymentData.status
    });
    
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      message: 'Failed to verify payment',
      error: error.message || 'Unknown error'
    });
  }
}
