
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MercadoPagoConfig {
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  redirectToSuccessPage?: boolean;
}

/**
 * Hook para integração com o Mercado Pago
 */
export function useMercadoPago(config?: MercadoPagoConfig) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { 
    onPaymentSuccess, 
    onPaymentError,
    redirectToSuccessPage = true 
  } = config || {};

  /**
   * Cria uma preferência de pagamento e redireciona para o checkout do Mercado Pago
   */
  const createSubscriptionAndRedirect = useCallback(async (
    planId: string, 
    userId: string, 
    amount: number,
    description: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[useMercadoPago] Criando preferência para assinatura:', {
        planId, userId, amount, description
      });

      // URL base para o webhook do Mercado Pago
      const webhookUrl = import.meta.env.VITE_SUPABASE_URL 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/mercadopago-webhook`
        : `${window.location.origin}/api/webhooks/mercadopago`;

      // Preparar objeto de preferência
      const preferenceData = {
        items: [
          {
            id: planId,
            title: description,
            description: `Assinatura: ${description}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: amount
          }
        ],
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`
        },
        auto_return: 'approved',
        notification_url: webhookUrl,
        external_reference: `plan_${planId}_user_${userId}`,
      };

      console.log('[useMercadoPago] Webhook URL:', webhookUrl);
      console.log('[useMercadoPago] Dados da preferência:', preferenceData);

      // Chamar API para criar preferência
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar preferência de pagamento');
      }

      const data = await response.json();
      console.log('[useMercadoPago] Preferência criada com sucesso:', data);
      
      // Registrar checkout no banco de dados
      try {
        const registerResponse = await fetch('/api/mercadopago/register-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            plan_id: planId,
            preference_id: data.id,
            amount
          })
        });

        if (!registerResponse.ok) {
          console.warn('[useMercadoPago] Aviso ao registrar checkout, mas continuando');
        }
      } catch (registerError) {
        console.error('[useMercadoPago] Erro ao registrar checkout:', registerError);
      }

      // Determinar URL de checkout baseado no ambiente
      const isSandbox = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX === 'true';
      const checkoutUrl = isSandbox ? data.sandbox_init_point : data.init_point;

      if (!checkoutUrl) {
        throw new Error('URL de checkout não recebida');
      }

      // Chamar callback de sucesso se fornecido
      if (onPaymentSuccess) {
        onPaymentSuccess({ 
          preferenceId: data.id, 
          checkoutUrl 
        });
      }

      // Redirecionar para o checkout se configurado
      if (redirectToSuccessPage) {
        console.log('[useMercadoPago] Redirecionando para:', checkoutUrl);
        window.location.href = checkoutUrl;
      }

      return {
        preferenceId: data.id,
        checkoutUrl
      };
    } catch (error: any) {
      console.error('[useMercadoPago] Erro ao criar preferência:', error);
      setError(error);
      
      // Chamar callback de erro se fornecido
      if (onPaymentError) {
        onPaymentError(error);
      }
      
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Erro desconhecido ao iniciar checkout',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast, onPaymentSuccess, onPaymentError, redirectToSuccessPage]);

  /**
   * Inicializa o brick de pagamento (não usado no fluxo de redirecionamento)
   */
  const initPaymentBrick = useCallback(() => {
    // Não implementado para o fluxo de redirecionamento
    setIsInitialized(true);
    return null;
  }, []);

  return {
    isLoading,
    isInitialized,
    error,
    createSubscriptionAndRedirect,
    initPaymentBrick
  };
}

export default useMercadoPago;
