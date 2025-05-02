
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
      subscriptionId,
      paymentMethodId: paymentData.payment_method_id
    });

    // Em um ambiente de produção, você comunicaria com a API do Mercado Pago.
    // Para fins de demonstração, simularemos um pagamento em processamento.
    const paymentResult = {
      id: `test_${Math.random().toString(36).substring(2, 15)}`,
      status: 'in_process', // Alterado para in_process para simular um PIX ou boleto
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
    };

    // Salvar no banco de dados
    const { error: paymentError, data: savedPayment } = await supabase
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
          original_request: {
            ...paymentData,
            // Remove dados sensíveis antes de salvar
            token: undefined,
            card: undefined
          }
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('[MercadoPago] Error saving payment:', paymentError);
      return res.status(500).json({ message: 'Database error', error: paymentError });
    }

    // Não atualizar a assinatura ainda para pagamentos em processamento
    // Isso será feito pelo webhook quando o pagamento for confirmado

    // Adicionar um log para depuração
    console.log('[MercadoPago] Payment processed successfully:', {
      paymentId: paymentResult.id,
      status: paymentResult.status
    });

    return res.status(200).json({ 
      success: true, 
      payment: paymentResult,
      savedPaymentId: savedPayment.id
    });
  } catch (error: any) {
    console.error('[MercadoPago] Payment processing error:', error);
    return res.status(500).json({ 
      message: 'Payment failed', 
      error: error.message || 'Unknown error' 
    });
  }
}
