
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
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
              initializeMercadoPago();
            } catch (error) {
              console.error('Erro ao inicializar Mercado Pago:', error);
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
          console.error('Erro ao carregar script:', err);
          setStatus('error');
          setErrorMessage('Falha ao preparar o checkout.');
        }
      };

      loadMercadoPago();
    }
  }, [status, planValue]);
  
  const initializeMercadoPago = () => {
    if (!(window as any).MercadoPago) {
      console.error('MercadoPago não está disponível');
      setStatus('error');
      setErrorMessage('Serviço de pagamento indisponível.');
      return;
    }
    
    const mp = new (window as any).MercadoPago(
      import.meta.env.VITE_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, 
      { locale: 'pt-BR' }
    );
    
    const bricksBuilder = mp.bricks();
    
    const renderPaymentBrick = async () => {
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
            console.log('Brick pronto');
            setStatus('idle');
          },
          onSubmit: async (formData: any) => {
            // Callback chamado quando o usuário clica no botão de pagar
            console.log('Payment submitted:', formData);
            setStatus('loading');
            
            try {
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
                console.error('Erro ao criar assinatura:', subscriptionError);
                throw new Error('Não foi possível registrar sua assinatura.');
              }
              
              const subscriptionId = subscription.id;
              
              // Processar o pagamento no backend
              const paymentData = {
                ...formData,
                transaction_amount: planValue,
                description: `Assinatura ${planName}`,
                metadata: {
                  user_id: userId,
                  plan_id: planId,
                  subscription_id: subscriptionId
                }
              };
              
              console.log('Enviando dados para processamento:', paymentData);
              
              // Simular a chamada para a API (em produção, deve-se usar uma API real)
              const response = await fetch('/api/mercadopago/process-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
              });
              
              const paymentResponse = await response.json();
              console.log('Resposta do processamento:', paymentResponse);
              
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
              } else {
                // Para outros status, aguardar o webhook
                toast({
                  title: 'Pagamento enviado',
                  description: 'Estamos processando seu pagamento.',
                });
                
                return true;
              }
            } catch (error: any) {
              console.error('Error in payment submission:', error);
              setStatus('error');
              setErrorMessage(error.message || 'Erro ao processar o pagamento');
              
              onError?.(error);
              return false;
            }
          },
          onError: (error: any) => {
            console.error('Brick error:', error);
            setStatus('error');
            setErrorMessage('Houve um erro ao processar o pagamento.');
            onError?.(error);
          }
        }
      };
      
      await bricksBuilder.create('payment', 'mercadopago-container', settings);
    };
    
    renderPaymentBrick();
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
      
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Carregando formulário de pagamento...</p>
        </div>
      )}
      
      <div 
        id="mercadopago-container" 
        ref={brickContainerRef} 
        className="w-full border border-gray-200 rounded-md p-4 mb-4 min-h-[350px]"
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
