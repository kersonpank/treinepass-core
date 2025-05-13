
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
    console.log('[API] Registering MercadoPago checkout:', req.body);
    
    const { user_id, plan_id, preference_id, amount } = req.body;
    
    // Validar dados obrigatórios
    if (!user_id || !plan_id || !preference_id) {
      return res.status(400).json({ 
        message: 'Missing required fields: user_id, plan_id, preference_id are required' 
      });
    }

    // Primeiro, garantir que qualquer assinatura pendente seja cancelada
    const { error: cancelError } = await supabase
      .from('user_plan_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .match({ 
        user_id,
        status: 'pending'
      });

    if (cancelError) {
      console.error('[API] Error cancelling pending subscriptions:', cancelError);
      // Continuar mesmo com erro
    }

    // Criar assinatura pendente
    const { data, error } = await supabase
      .from('user_plan_subscriptions')
      .insert({
        user_id,
        plan_id,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'mercadopago',
        total_value: amount,
        start_date: new Date().toISOString().split('T')[0], // Data atual
      })
      .select();

    if (error) {
      console.error('[API] Error creating subscription:', error);
      return res.status(500).json({ 
        message: 'Failed to register checkout', 
        error: error.message || 'Database error' 
      });
    }

    // Registrar pagamento
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id,
        external_id: preference_id,
        status: 'pending',
        amount,
        payment_method: 'mercadopago',
        due_date: new Date().toISOString(),
        metadata: {
          plan_id,
          preference_id,
          subscription_id: data?.[0]?.id,
          created_at: new Date().toISOString()
        }
      });

    if (paymentError) {
      console.error('[API] Error registering payment:', paymentError);
      // Continuar mesmo com erro
    }

    console.log('[API] MercadoPago checkout registered successfully');

    return res.status(200).json({ 
      success: true, 
      subscription_id: data?.[0]?.id || null 
    });
    
  } catch (error: any) {
    console.error('[API] Error registering checkout:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message || 'Unknown error'
    });
  }
}
