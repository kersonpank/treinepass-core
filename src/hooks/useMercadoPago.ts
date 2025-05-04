
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseMercadoPagoOptions {
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  redirectToSuccessPage?: boolean;
}

export function useMercadoPago({
  onPaymentSuccess,
  onPaymentError,
  redirectToSuccessPage = true,
}: UseMercadoPagoOptions = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mercadoPagoInstance, setMercadoPagoInstance] = useState<any>(null);
  const { toast } = useToast();

  // 1. Carregar o Mercado Pago SDK
  useEffect(() => {
    const loadMercadoPagoSDK = async () => {
      try {
        console.log('[MercadoPago] Inicializando SDK...');
        setIsLoading(true);

        // Verificar se o SDK já está carregado
        if (window.MercadoPago) {
          console.log('[MercadoPago] SDK já carregado');
          initializeMercadoPagoInstance();
          return;
        }

        // Carregar o script do SDK
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        
        // Quando o script for carregado, inicializar o SDK
        script.onload = () => {
          console.log('[MercadoPago] Script carregado com sucesso');
          initializeMercadoPagoInstance();
        };
        
        script.onerror = (e) => {
          const errorMsg = 'Falha ao carregar o SDK do Mercado Pago';
          console.error('[MercadoPago] ' + errorMsg, e);
          setError(new Error(errorMsg));
          setIsLoading(false);
          toast({
            title: 'Erro no pagamento',
            description: 'Não foi possível carregar o sistema de pagamento',
            variant: 'destructive'
          });
        };
        
        document.body.appendChild(script);
        
      } catch (err: any) {
        console.error('[MercadoPago] Erro:', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erro',
          description: err.message || 'Ocorreu um erro ao preparar o pagamento',
          variant: 'destructive'
        });
      }
    };
    
    // Função para inicializar a instância do Mercado Pago
    const initializeMercadoPagoInstance = () => {
      try {
        const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
        
        if (!publicKey) {
          throw new Error('Chave pública do Mercado Pago não configurada');
        }
        
        console.log('[MercadoPago] Inicializando com chave pública');
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        setMercadoPagoInstance(mp);
        setIsInitialized(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('[MercadoPago] Erro ao inicializar:', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erro na inicialização',
          description: err.message || 'Não foi possível inicializar o sistema de pagamento',
          variant: 'destructive'
        });
      }
    };

    loadMercadoPagoSDK();
  }, [toast]);

  // 2. Função para inicializar o Brick de Pagamento
  const initPaymentBrick = async (containerId: string, amount: number, metadata: Record<string, any> = {}) => {
    if (!isInitialized || !mercadoPagoInstance) {
      console.error('[MercadoPago] SDK não inicializado');
      return;
    }

    try {
      console.log(`[MercadoPago] Inicializando brick de pagamento no container #${containerId}`);
      const bricksBuilder = mercadoPagoInstance.bricks();
      
      const settings = {
        initialization: {
          amount,
        },
        callbacks: {
          onReady: () => {
            console.log('[MercadoPago] Brick carregado');
            setIsLoading(false);
          },
          onError: (error: any) => {
            console.error('[MercadoPago] Erro no brick:', error);
            setError(error);
            if (onPaymentError) onPaymentError(error);
          },
          onSubmit: async (cardFormData: any) => {
            setIsLoading(true);
            
            try {
              // Adicionar metadados ao payload
              const payloadWithMetadata = {
                ...cardFormData,
                metadata: {
                  ...metadata
                }
              };
              
              // Processar pagamento via API
              const response = await fetch('/api/payments/process', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payloadWithMetadata),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao processar pagamento');
              }
              
              const data = await response.json();
              
              if (data.success) {
                if (onPaymentSuccess) onPaymentSuccess(data);
                
                toast({
                  title: 'Pagamento realizado',
                  description: 'Seu pagamento foi processado com sucesso!',
                });
                
                if (redirectToSuccessPage) {
                  window.location.href = `/payment/success?payment_id=${data.payment.id}`;
                }
              }
            } catch (error: any) {
              console.error('[MercadoPago] Erro ao processar pagamento:', error);
              toast({
                title: 'Erro no pagamento',
                description: error.message || 'Ocorreu um erro ao processar o pagamento',
                variant: 'destructive'
              });
              
              if (onPaymentError) onPaymentError(error);
            } finally {
              setIsLoading(false);
            }
          }
        },
        locale: 'pt-BR',
        customization: {
          visual: {
            hideFormTitle: true,
            hidePaymentButton: false
          }
        },
      };
      
      bricksBuilder.create('payment', settings, containerId);
      
    } catch (err: any) {
      console.error('[MercadoPago] Erro ao inicializar brick:', err);
      setError(err);
      if (onPaymentError) onPaymentError(err);
      toast({
        title: 'Erro no módulo de pagamento',
        description: err.message || 'Não foi possível inicializar o formulário de pagamento',
        variant: 'destructive'
      });
    }
  };

  // 3. Função para criar preferência e redirecionar para checkout
  const createSubscriptionAndRedirect = async (
    planId: string,
    userId: string,
    amount: number,
    planName: string
  ): Promise<{ success: boolean; checkoutUrl: string }> => {
    try {
      console.log('[MercadoPago] Criando preferência para checkout');
      setIsLoading(true);
      
      // 1. Criar preferência no Mercado Pago
      const preferenceData = {
        items: [
          {
            title: `Assinatura ${planName}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          },
        ],
        payer: {
          // Os dados do pagador serão obtidos no checkout do Mercado Pago
          email: '',
        },
        external_reference: `plan_${planId}_user_${userId}`,
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`,
        },
        auto_return: 'approved',
      };
      
      // 2. Chamar nossa API para criar a preferência
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferenceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar preferência de pagamento');
      }
      
      const data = await response.json();
      
      // 3. Registrar checkout no nosso banco
      await fetch('/api/mercadopago/register-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          preference_id: data.id,
          amount: amount,
        }),
      });
      
      // 4. Determinar URL de checkout (sandbox ou produção)
      const isSandbox = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX === 'true';
      const checkoutUrl = isSandbox ? data.sandbox_init_point : data.init_point;
      
      console.log('[MercadoPago] Preference criada, URL:', checkoutUrl);
      setIsLoading(false);
      
      return { success: true, checkoutUrl };
      
    } catch (err: any) {
      console.error('[MercadoPago] Erro ao criar preferência:', err);
      setError(err);
      setIsLoading(false);
      
      if (onPaymentError) onPaymentError(err);
      toast({
        title: 'Erro na preparação',
        description: err.message || 'Não foi possível preparar o checkout',
        variant: 'destructive',
      });
      
      return { success: false, checkoutUrl: '' };
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    mercadoPagoInstance,
    initPaymentBrick,
    createSubscriptionAndRedirect
  };
}

export default useMercadoPago;
