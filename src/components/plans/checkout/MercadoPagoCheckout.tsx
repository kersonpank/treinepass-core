
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MercadoPagoCheckoutProps {
  planId: string;
  planName: string;
  planValue: number;
  userId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function MercadoPagoCheckout({
  planId,
  planName,
  planValue,
  userId,
  onSuccess,
  onError,
}: MercadoPagoCheckoutProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const brickContainerRef = useRef<HTMLDivElement>(null);
  
  // Verificar se já existe uma assinatura
  useEffect(() => {
    if (userId && planId) {
      const checkExistingSubscription = async () => {
        try {
          const { data, error } = await supabase
            .from('user_plan_subscriptions')
            .select('id, plan_id, status')
            .eq('user_id', userId)
            .eq('plan_id', planId)
            .eq('status', 'active')
            .maybeSingle();
            
          if (error) {
            console.error('[MercadoPagoCheckout] Erro ao verificar assinatura:', error);
          }
          
          if (data) {
            console.log('[MercadoPagoCheckout] Usuário já possui assinatura ativa para este plano', data);
            setErrorMessage('Você já possui uma assinatura ativa para este plano.');
            setStatus('error');
            onError?.({ message: 'Assinatura já existe' });
          } else {
            setStatus('idle');
          }
        } catch (err) {
          console.error('[MercadoPagoCheckout] Erro em checkExistingSubscription:', err);
          setStatus('idle');
        }
      };
      
      checkExistingSubscription();
    }
  }, [userId, planId, onError]);

  useEffect(() => {
    if (status === 'idle' && brickContainerRef.current) {
      const loadMercadoPago = async () => {
        try {
          // Carregar o script do Mercado Pago
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          
          script.onload = () => {
            try {
              console.log('[MercadoPago] Script carregado com sucesso. Inicializando brick...');
              initializeMercadoPago();
            } catch (error) {
              console.error('[MercadoPago] Erro ao inicializar Mercado Pago:', error);
              setStatus('error');
              setErrorMessage('Não foi possível inicializar o checkout.');
            }
          };
          
          script.onerror = () => {
            setStatus('error');
            setErrorMessage('Não foi possível carregar o Mercado Pago.');
          };
          
          document.body.appendChild(script);
        } catch (err) {
          console.error('[MercadoPago] Erro ao carregar script:', err);
          setStatus('error');
          setErrorMessage('Falha ao preparar o checkout.');
        }
      };

      loadMercadoPago();
    }
  }, [status, planValue]);
  
  const initializeMercadoPago = () => {
    if (!(window as any).MercadoPago) {
      console.error('[MercadoPago] MercadoPago não está disponível');
      setStatus('error');
      setErrorMessage('Serviço de pagamento indisponível.');
      return;
    }
    
    try {
      const publicKey = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
      if (!publicKey) {
        console.error('[MercadoPago] Chave pública não configurada');
        setStatus('error');
        setErrorMessage('Configuração de pagamento incompleta.');
        return;
      }
      
      console.log('[MercadoPago] Inicializando com chave pública');
      const mp = new (window as any).MercadoPago(publicKey, { locale: 'pt-BR' });
      
      const bricksBuilder = mp.bricks();
      
      const renderPaymentBrick = async () => {
        console.log('[MercadoPago] Renderizando brick de pagamento');
        
        // Limpar o container antes de renderizar
        if (brickContainerRef.current) {
          brickContainerRef.current.innerHTML = '';
        }
        
        const settings = {
          initialization: {
            amount: planValue,
            payer: {
              email: '',
            },
          },
          customization: {
            visual: {
              hideFormTitle: true,
              hidePaymentButton: false,
            },
            paymentMethods: {
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              console.log('[MercadoPago] Brick pronto');
              setStatus('idle');
            },
            onSubmit: async (cardFormData: any) => {
              console.log('[MercadoPago] Formulário enviado:', cardFormData);
              
              // Alterar status para processamento
              setStatus('processing');
              
              try {
                console.log('[MercadoPago] Criando assinatura pendente');
                
                // Criar uma assinatura pendente
                const { data: subscription, error: subscriptionError } = await supabase
                  .from('user_plan_subscriptions')
                  .insert({
                    user_id: userId,
                    plan_id: planId,
                    status: 'pending',
                    payment_method: 'mercadopago',
                    payment_status: 'pending',
                    start_date: new Date().toISOString().split('T')[0],
                    total_value: planValue,
                  })
                  .select()
                  .single();
                
                if (subscriptionError) {
                  console.error('[MercadoPago] Erro ao criar assinatura:', subscriptionError);
                  throw new Error('Não foi possível registrar sua assinatura.');
                }
                
                const subscriptionId = subscription.id;
                
                // Processar o pagamento no backend
                const paymentData = {
                  ...cardFormData,
                  transaction_amount: planValue,
                  description: `Assinatura ${planName}`,
                  metadata: {
                    user_id: userId,
                    plan_id: planId,
                    subscription_id: subscriptionId
                  }
                };
                
                console.log('[MercadoPago] Enviando dados para processamento:', 
                  JSON.stringify({
                    ...paymentData,
                    token: paymentData.token ? '***REDACTED***' : undefined
                  })
                );
                
                // Chamar API para processar o pagamento
                const response = await fetch('/api/mercadopago/process-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(paymentData)
                });
                
                const paymentResponse = await response.json();
                console.log('[MercadoPago] Resposta do processamento:', paymentResponse);
                
                if (!response.ok) {
                  throw new Error(paymentResponse.message || 'Erro ao processar pagamento');
                }
                
                // Atualizar assinatura no banco se o pagamento foi aprovado
                if (paymentResponse.success && paymentResponse.payment.status === 'approved') {
                  await supabase
                    .from('user_plan_subscriptions')
                    .update({
                      payment_status: 'paid',
                      status: 'active',
                      payment_id: paymentResponse.payment.id
                    })
                    .eq('id', subscriptionId);
                  
                  setStatus('success');
                  toast({
                    title: 'Pagamento aprovado!',
                    description: 'Sua assinatura foi ativada com sucesso.',
                  });
                  
                  setTimeout(() => {
                    onSuccess?.();
                    navigate('/dashboard');
                  }, 2000);
                  
                  return true;
                } else if (paymentResponse.payment.status === 'in_process' || 
                           paymentResponse.payment.status === 'pending') {
                  // Para pagamentos com status pendente (PIX, boleto)
                  toast({
                    title: 'Pagamento em processamento',
                    description: 'Estamos verificando seu pagamento. Você receberá uma confirmação em breve.',
                  });
                  
                  setStatus('success');
                  
                  setTimeout(() => {
                    onSuccess?.();
                    navigate('/payment-status', { 
                      state: { 
                        paymentId: paymentResponse.payment.id,
                        paymentStatus: paymentResponse.payment.status,
                        subscriptionId
                      } 
                    });
                  }, 2000);
                  
                  return true;
                } else {
                  // Para outros status, aguardar o webhook
                  toast({
                    title: 'Pagamento enviado',
                    description: 'Estamos processando seu pagamento.',
                  });
                  
                  setStatus('success');
                  return true;
                }
              } catch (error: any) {
                console.error('[MercadoPago] Error in payment submission:', error);
                setStatus('error');
                setErrorMessage(error.message || 'Erro ao processar o pagamento');
                
                onError?.(error);
                return false;
              }
            },
            onError: (error: any) => {
              console.error('[MercadoPago] Brick error:', error);
              setStatus('error');
              setErrorMessage('Houve um erro ao processar o pagamento.');
              onError?.(error);
            }
          }
        };
        
        try {
          await bricksBuilder.create('payment', 'mercadopago-container', settings);
          console.log('[MercadoPago] Brick criado com sucesso');
        } catch (error) {
          console.error('[MercadoPago] Erro ao criar brick:', error);
          setStatus('error');
          setErrorMessage('Falha ao inicializar o formulário de pagamento.');
        }
      };
      
      renderPaymentBrick();
    } catch (error) {
      console.error('[MercadoPago] Erro ao inicializar MercadoPago:', error);
      setStatus('error');
      setErrorMessage('Falha ao configurar o checkout.');
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage('');
    if (brickContainerRef.current) {
      brickContainerRef.current.innerHTML = '';
      initializeMercadoPago();
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Pagamento com Mercado Pago</h2>
      
      <div className="mb-4">
        <p className="mb-2">Plano: <strong>{planName}</strong></p>
        <p className="mb-4">Valor: <strong>R$ {planValue.toFixed(2).replace('.', ',')}</strong></p>
      </div>
      
      {(status === 'loading' || status === 'processing') && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>{status === 'processing' ? "Processando pagamento..." : "Carregando formulário de pagamento..."}</p>
        </div>
      )}
      
      <div 
        id="mercadopago-container" 
        ref={brickContainerRef} 
        className={`w-full border border-gray-200 rounded-md p-4 mb-4 min-h-[350px] ${
          status === 'processing' || status === 'loading' ? 'opacity-50' : ''
        }`}
      ></div>

      {status === 'success' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Pagamento realizado com sucesso! Redirecionando...
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || "Ocorreu um erro no pagamento. Tente novamente."}
            <Button 
              variant="outline" 
              className="mt-2 w-full"
              onClick={handleRetry}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
