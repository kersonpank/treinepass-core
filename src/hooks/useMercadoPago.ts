
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

import { 
  MP_PUBLIC_KEY, 
  initMercadoPagoSDK, 
  createPaymentBrick, 
  createPaymentPreference, 
  getInitPoint,
  MercadoPagoItem,
  MercadoPagoPayer
} from '@/services/mercadopago';

interface UseMercadoPagoOptions {
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onInitError?: (error: any) => void;
  redirectToSuccessPage?: boolean;
}

export function useMercadoPago(options: UseMercadoPagoOptions = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  const { 
    onPaymentSuccess, 
    onPaymentError, 
    onInitError, 
    redirectToSuccessPage = false
  } = options;

  // Initialize the SDK
  useEffect(() => {
    try {
      if (!MP_PUBLIC_KEY) {
        throw new Error('Mercado Pago public key not configured');
      }

      initMercadoPagoSDK();
      setIsInitialized(true);
    } catch (err: any) {
      console.error('Error initializing Mercado Pago:', err);
      setError(err);
      if (onInitError) {
        onInitError(err);
      }
    }
  }, [onInitError]);

  // Create payment brick
  const initPaymentBrick = useCallback((
    containerId: string,
    amount: number,
    metadata?: Record<string, any>
  ) => {
    if (!isInitialized || !MP_PUBLIC_KEY) {
      setError(new Error('Mercado Pago not initialized'));
      return;
    }

    try {
      setIsLoading(true);
      
      createPaymentBrick(containerId, {
        amount,
        metadata,
        callbackSuccess: async (data) => {
          console.log('Payment successful:', data);
          setIsLoading(false);
          
          if (onPaymentSuccess) {
            onPaymentSuccess(data);
          }
          
          toast({
            title: 'Pagamento realizado com sucesso!',
            description: 'Sua assinatura está ativa.',
          });
          
          if (redirectToSuccessPage) {
            navigate('/payment-success');
          }
        },
        callbackError: (error) => {
          console.error('Payment error:', error);
          setIsLoading(false);
          setError(error);
          
          if (onPaymentError) {
            onPaymentError(error);
          }
          
          toast({
            title: 'Erro no pagamento',
            description: error.message || 'Ocorreu um erro ao processar seu pagamento.',
            variant: 'destructive',
          });
        }
      });
    } catch (err: any) {
      console.error('Error initializing payment brick:', err);
      setIsLoading(false);
      setError(err);
      
      toast({
        title: 'Erro na inicialização',
        description: 'Não foi possível inicializar o formulário de pagamento.',
        variant: 'destructive',
      });
    }
  }, [isInitialized, navigate, onPaymentError, onPaymentSuccess, redirectToSuccessPage]);

  // Create a payment preference
  const createPreference = useCallback(async (
    items: MercadoPagoItem[],
    payer?: MercadoPagoPayer,
    externalReference?: string
  ) => {
    try {
      setIsLoading(true);
      
      const preference = await createPaymentPreference({
        items,
        payer,
        back_urls: {
          success: `${window.location.origin}/payment-success`,
          failure: `${window.location.origin}/payment-failure`,
          pending: `${window.location.origin}/payment-pending`,
        },
        auto_return: 'approved',
        external_reference: externalReference,
      });
      
      setIsLoading(false);
      return preference;
    } catch (err: any) {
      console.error('Error creating preference:', err);
      setIsLoading(false);
      setError(err);
      
      toast({
        title: 'Erro na criação do pagamento',
        description: err.message || 'Ocorreu um erro ao criar o link de pagamento.',
        variant: 'destructive',
      });
      
      throw err;
    }
  }, []);

  // Redirect to checkout
  const redirectToCheckout = useCallback(async (
    items: MercadoPagoItem[],
    payer?: MercadoPagoPayer,
    externalReference?: string
  ) => {
    try {
      const preference = await createPreference(items, payer, externalReference);
      const checkoutUrl = getInitPoint(preference);
      
      // Redirect to Mercado Pago checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      // Error already handled in createPreference
      console.error('Error redirecting to checkout:', err);
    }
  }, [createPreference]);

  // Save subscription record before redirecting
  const createSubscriptionAndRedirect = useCallback(async (
    planId: string,
    userId: string,
    amount: number,
    planName: string
  ) => {
    try {
      setIsLoading(true);
      
      // Create pending subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_plan_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'mercadopago',
          start_date: new Date().toISOString().split('T')[0],
          total_value: amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (subscriptionError) {
        throw new Error(`Error creating subscription: ${subscriptionError.message}`);
      }
      
      // Get user details
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.warn(`Could not fetch user details: ${userError.message}`);
      }
      
      // Create items for checkout
      const items = [{
        id: planId,
        title: `Assinatura ${planName}`,
        quantity: 1,
        unit_price: amount,
        description: `Assinatura do plano ${planName}`,
      }];
      
      // Create payer object if user details available
      const payer = user ? {
        email: user.email || '',
        name: user.full_name ? user.full_name.split(' ')[0] : '',
        surname: user.full_name ? user.full_name.split(' ').slice(1).join(' ') : '',
        ...(user.cpf && {
          identification: {
            type: 'CPF',
            number: user.cpf.replace(/\D/g, '')
          }
        })
      } : undefined;
      
      // Redirect to Mercado Pago checkout
      await redirectToCheckout(
        items,
        payer,
        subscription.id
      );
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error creating subscription and redirecting:', err);
      setIsLoading(false);
      setError(err);
      
      toast({
        title: 'Erro na preparação do pagamento',
        description: err.message || 'Ocorreu um erro ao preparar o pagamento.',
        variant: 'destructive',
      });
    }
  }, [redirectToCheckout]);

  return {
    isInitialized,
    isLoading,
    error,
    initPaymentBrick,
    createPreference,
    redirectToCheckout,
    createSubscriptionAndRedirect,
  };
}
