
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
    // Extrair dados do webhook
    const { id, topic, type } = req.query;
    const eventType = topic || type;
    const eventId = id;
    
    console.log('[MercadoPago] Received webhook:', { id, topic, type, body: req.body });
    
    // Registrar evento do webhook
    const { error: logError } = await supabase
      .from('mercadopago_webhook_events')
      .insert({
        event_id: eventId as string,
        event_type: eventType as string,
        payload: req.body,
      });

    if (logError) {
      console.error('[MercadoPago] Error logging webhook event:', logError);
    }
    
    // Se não for um evento de pagamento, não processamos
    if (eventType !== 'payment') {
      return res.status(200).json({ message: 'Event received but not processed (not a payment event)' });
    }
    
    // Buscar detalhes do pagamento no nosso banco
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', eventId)
      .single();
      
    if (paymentError) {
      console.error('[MercadoPago] Payment not found in database:', eventId);
      return res.status(200).json({ message: 'Payment not found in database' });
    }
    
    // Extrair o status do pagamento do corpo do webhook
    const paymentStatus = req.body.status || req.body.action || 'unknown';
    console.log('[MercadoPago] Updating payment status:', { 
      paymentId: eventId, 
      newStatus: paymentStatus, 
      oldStatus: paymentData.status 
    });
    
    // Atualizar status do pagamento no banco de dados
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...paymentData.metadata,
          webhook_data: req.body,
          status_history: [
            ...(paymentData.metadata?.status_history || []),
            {
              status: paymentStatus,
              timestamp: new Date().toISOString()
            }
          ]
        }
      })
      .eq('external_id', eventId);

    if (updateError) {
      console.error('[MercadoPago] Error updating payment status:', updateError);
    }
    
    // Se o pagamento foi aprovado, atualizar a assinatura
    if (paymentStatus === 'approved') {
      const userId = paymentData.metadata?.user_id;
      const planId = paymentData.metadata?.plan_id;
      const subscriptionId = paymentData.metadata?.subscription_id;
      
      if (userId && planId && subscriptionId) {
        // Cancelar quaisquer assinaturas pendentes anteriores
        const { error: cancelError } = await supabase
          .from('user_plan_subscriptions')
          .update({ 
            status: 'cancelled', 
            cancelled_at: new Date().toISOString() 
          })
          .eq('user_id', userId)
          .neq('id', subscriptionId)
          .eq('status', 'pending');
          
        if (cancelError) {
          console.error('[MercadoPago] Error cancelling pending subscriptions:', cancelError);
        }
        
        // Atualizar a assinatura para ativa
        const { error: subscriptionError } = await supabase
          .from('user_plan_subscriptions')
          .update({
            status: 'active',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
            payment_id: eventId as string
          })
          .eq('id', subscriptionId);
        
        if (subscriptionError) {
          console.error('[MercadoPago] Error updating subscription:', subscriptionError);
        } else {
          console.log('[MercadoPago] Subscription activated successfully:', subscriptionId);
        }
      }
    }
    
    // Responder ao webhook
    return res.status(200).json({ success: true });
    
  } catch (error: any) {
    console.error('[MercadoPago] Error processing webhook:', error);
    return res.status(500).json({
      message: 'Error processing webhook',
      error: error.message || 'Unknown error'
    });
  }
}
