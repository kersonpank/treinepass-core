
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseMercadoPagoOptions {
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  redirectToSuccessPage?: boolean;
}

export function useMercadoPago(options: UseMercadoPagoOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  
  // Environment variables
  const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

  // Initialize MercadoPago SDK
  const initializeMercadoPago = async () => {
    try {
      if ((window as any).MercadoPago) {
        setIsInitialized(true);
        return true;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      
      script.onload = () => {
        const mp = new (window as any).MercadoPago(publicKey, {
          locale: 'pt-BR',
        });
        
        (window as any).mercadoPagoInstance = mp;
        setIsInitialized(true);
        console.log('MercadoPago SDK initialized successfully');
      };
      
      script.onerror = (e) => {
        console.error('Error loading MercadoPago SDK:', e);
        setError(new Error('Não foi possível carregar o SDK do Mercado Pago'));
      };
      
      document.body.appendChild(script);
      return true;
    } catch (err) {
      console.error('Error initializing MercadoPago:', err);
      setError(err instanceof Error ? err : new Error('Erro ao inicializar Mercado Pago'));
      return false;
    }
  };

  // Initialize payment brick
  const initPaymentBrick = (containerId: string, amount: number, metadata: Record<string, any> = {}) => {
    try {
      if (!isInitialized || !(window as any).mercadoPagoInstance) {
        console.error('MercadoPago SDK not initialized');
        return false;
      }

      const mp = (window as any).mercadoPagoInstance;
      const brickBuilder = mp.bricks();
      
      const renderComponent = async () => {
        await brickBuilder.create('payment', containerId, {
          initialization: {
            amount: amount.toString(),
          },
          customization: {
            paymentMethods: {
              maxInstallments: 6,
            },
          },
          callbacks: {
            onReady: () => {
              console.log('Brick ready');
            },
            onSubmit: async (formData: any) => {
              setIsLoading(true);
              
              try {
                console.log('Payment form submitted:', formData);
                
                // Get user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');
                
                // Register checkout in our system
                const response = await fetch('/api/mercadopago/register-checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: user.id,
                    plan_id: metadata.plan_id,
                    preference_id: formData.token,
                    amount,
                    ...metadata
                  }),
                });
                
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Error processing payment');
                }
                
                const result = await response.json();
                
                if (options.onPaymentSuccess) {
                  options.onPaymentSuccess(result);
                }
                
                toast({
                  title: "Pagamento iniciado",
                  description: "Seu pagamento está sendo processado",
                });
                
                return { status: 'success' };
              } catch (error) {
                console.error('Payment submission error:', error);
                setError(error instanceof Error ? error : new Error('Payment processing error'));
                
                if (options.onPaymentError) {
                  options.onPaymentError(error);
                }
                
                toast({
                  variant: "destructive",
                  title: "Erro no pagamento",
                  description: error instanceof Error ? error.message : "Erro ao processar pagamento",
                });
                
                return { status: 'error' };
              } finally {
                setIsLoading(false);
              }
            },
            onError: (error: any) => {
              console.error('Brick error:', error);
              setError(new Error(error.message || 'Erro no componente de pagamento'));
              
              if (options.onPaymentError) {
                options.onPaymentError(error);
              }
            },
          },
        });
      };
      
      renderComponent();
      return true;
    } catch (error) {
      console.error('Error rendering payment brick:', error);
      setError(error instanceof Error ? error : new Error('Error rendering payment component'));
      return false;
    }
  };

  // Create subscription and redirect to checkout
  const createSubscriptionAndRedirect = async (
    planId: string,
    userId: string,
    amount: number,
    description: string
  ) => {
    try {
      setIsLoading(true);
      
      // Get user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Create a preference through our API
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: planId,
              title: description,
              quantity: 1,
              unit_price: amount,
              currency_id: 'BRL',
            },
          ],
          payer: {
            email: userProfile?.email || '',
          },
          metadata: {
            user_id: userId,
            plan_id: planId,
          },
          back_urls: {
            success: `${window.location.origin}/payment/success`,
            failure: `${window.location.origin}/payment/failure`,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating payment preference');
      }
      
      const preferenceData = await response.json();
      
      // Register checkout in our system
      await fetch('/api/mercadopago/register-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          preference_id: preferenceData.id,
          amount,
        }),
      });
      
      // If redirect option is enabled, redirect to checkout
      if (options.redirectToSuccessPage && preferenceData.init_point) {
        window.location.href = preferenceData.init_point;
      }
      
      return {
        success: true,
        preferenceId: preferenceData.id,
        checkoutUrl: preferenceData.init_point,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      
      if (options.onPaymentError) {
        options.onPaymentError(error);
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao criar assinatura",
        description: error instanceof Error ? error.message : "Erro ao processar sua solicitação",
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize SDK when hook is first used
  useState(() => {
    initializeMercadoPago();
  });

  return {
    isLoading,
    error,
    isInitialized,
    initPaymentBrick,
    createSubscriptionAndRedirect,
  };
}
