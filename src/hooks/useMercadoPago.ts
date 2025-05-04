
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MercadoPagoConfig {
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  redirectToSuccessPage?: boolean;
}

export function useMercadoPago(config?: MercadoPagoConfig) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  /**
   * Cria uma preferência de pagamento e redireciona o usuário para o checkout
   */
  const createSubscriptionAndRedirect = async (
    planId: string,
    userId: string,
    amount: number,
    description: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Registrar checkout no nosso banco
      const registerResponse = await fetch('/api/mercadopago/register-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          preference_id: `plan_${planId}_user_${userId}`,
          amount: amount,
          description: description,
        }),
      });
      
      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'Erro ao registrar checkout');
      }
      
      const subscriptionData = await registerResponse.json();
      
      // 2. Criar preferência no Mercado Pago
      const preferenceResponse = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              title: description,
              unit_price: amount,
              quantity: 1,
              currency_id: 'BRL',
            },
          ],
          payer: {
            email: '', // A API vai buscar o email do usuário
          },
          external_reference: `plan_${planId}_user_${userId}`,
          back_urls: {
            success: `${window.location.origin}/payment/success`,
            failure: `${window.location.origin}/payment/failure`,
            pending: `${window.location.origin}/payment/pending`,
          },
          auto_return: 'approved',
        }),
      });
      
      if (!preferenceResponse.ok) {
        const errorData = await preferenceResponse.json();
        throw new Error(errorData.message || 'Erro ao criar preferência de pagamento');
      }
      
      const preference = await preferenceResponse.json();
      
      // Determinar qual URL usar (sandbox ou produção)
      const checkoutUrl = process.env.NODE_ENV === 'production' 
        ? preference.init_point 
        : preference.sandbox_init_point;
      
      if (config?.onPaymentSuccess) {
        config.onPaymentSuccess({
          preference_id: preference.id,
          checkout_url: checkoutUrl,
          subscription_id: subscriptionData.subscription_id
        });
      }
      
      // Se configurado para redirecionar automaticamente
      if (config?.redirectToSuccessPage !== false) {
        window.location.href = checkoutUrl;
      }
      
      return {
        success: true,
        preferenceId: preference.id,
        checkoutUrl: checkoutUrl,
      };
      
    } catch (error: any) {
      console.error('Erro ao criar preferência:', error);
      setError(error);
      
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Ocorreu um erro ao processar o pagamento',
        variant: 'destructive',
      });
      
      if (config?.onPaymentError) {
        config.onPaymentError(error);
      }
      
      return {
        success: false,
        error: error.message || 'Ocorreu um erro ao processar o pagamento',
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    error,
    createSubscriptionAndRedirect,
  };
}
