
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MercadoPagoBrick } from '@/components/payments/MercadoPagoBrick';

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check for existing subscription
  useEffect(() => {
    if (userId && planId) {
      const checkExistingSubscription = async () => {
        try {
          setStatus('loading');
          
          const { data, error } = await supabase
            .from('user_plan_subscriptions')
            .select('id, plan_id, status')
            .eq('user_id', userId)
            .eq('plan_id', planId)
            .eq('status', 'active')
            .maybeSingle();
            
          if (error) {
            console.error('[MercadoPagoCheckout] Error checking subscription:', error);
            // Continue even with error, just log it
          }
          
          if (data) {
            console.log('[MercadoPagoCheckout] User already has active subscription for this plan', data);
            setErrorMessage('Você já possui uma assinatura ativa para este plano.');
            setStatus('error');
            onError?.({ message: 'Assinatura já existe' });
          } else {
            setStatus('idle');
          }
        } catch (err) {
          console.error('[MercadoPagoCheckout] Error in checkExistingSubscription:', err);
          setStatus('idle');
        }
      };
      
      checkExistingSubscription();
    }
  }, [userId, planId, onError]);

  const handlePaymentSuccess = async () => {
    console.log('[MercadoPagoCheckout] Payment success handler called');
    setStatus('success');
    
    toast({
      title: 'Pagamento realizado com sucesso!',
      description: 'Seu plano foi ativado.',
      variant: 'default',
    });
    
    if (onSuccess) {
      onSuccess();
    }
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handlePaymentError = (error: any) => {
    console.error('[MercadoPagoCheckout] Payment error:', error);
    setStatus('error');
    
    // Improve error message for user
    let errorMsg = 'Ocorreu um erro ao processar o pagamento';
    
    if (error.message) {
      if (error.message.includes('declined')) {
        errorMsg = 'Pagamento recusado. Verifique os dados do cartão ou tente com outro meio de pagamento.';
      } else if (error.message.includes('insufficient')) {
        errorMsg = 'Saldo insuficiente. Verifique os dados do cartão ou tente com outro meio de pagamento.';
      } else if (error.message.includes('expires') || error.message.includes('expiration')) {
        errorMsg = 'Cartão expirado. Verifique a data de validade ou use outro cartão.';
      } else {
        errorMsg = error.message;
      }
    }
    
    setErrorMessage(errorMsg);
    toast({
      title: 'Erro no pagamento',
      description: errorMsg,
      variant: 'destructive',
    });
    
    if (onError) {
      onError(error);
    }
  };

  // Retry payment without redirecting or reloading
  const handleRetry = () => {
    console.log('[MercadoPagoCheckout] Retrying payment');
    setStatus('idle');
    setErrorMessage('');
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
          <p>Preparando formulário de pagamento...</p>
        </div>
      )}
      
      {status === 'idle' && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Preencha os dados do seu cartão para concluir a assinatura do plano.
          </p>
          <MercadoPagoBrick
            amount={planValue}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            metadata={{
              user_id: userId,
              plan_id: planId,
              plan_name: planName
            }}
          />
        </>
      )}

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
            {errorMessage}
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

export default MercadoPagoCheckout;
