
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { user_id, plan_id, preference_id, amount } = req.body;

    if (!user_id || !plan_id || !preference_id || !amount) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    // Verificar se já existe uma assinatura ativa para este usuário/plano
    const { data: existingSubscription } = await supabase
      .from('user_plan_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('plan_id', plan_id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return res.status(409).json({
        message: 'User already has an active subscription for this plan',
        subscription: existingSubscription
      });
    }

    // Criar uma assinatura pendente
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_plan_subscriptions')
      .insert({
        user_id,
        plan_id,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'mercadopago',
        total_value: amount,
        metadata: {
          preference_id,
          checkout_started_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating pending subscription:', subscriptionError);
      return res.status(500).json({
        message: 'Failed to create subscription',
        error: subscriptionError
      });
    }

    // Registrar uma tentativa de pagamento
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        external_id: preference_id,
        user_id,
        status: 'pending',
        amount,
        payment_method: 'mercadopago',
        metadata: {
          plan_id,
          subscription_id: subscription.id,
          preference_id
        }
      });

    if (paymentError) {
      console.error('Error registering payment attempt:', paymentError);
      return res.status(500).json({
        message: 'Failed to register payment attempt',
        error: paymentError
      });
    }

    return res.status(200).json({
      success: true,
      subscription_id: subscription.id
    });
  } catch (error: any) {
    console.error('Error registering checkout:', error);
    return res.status(500).json({
      message: 'Error registering checkout',
      error: error.message || 'Unknown error'
    });
  }
}
