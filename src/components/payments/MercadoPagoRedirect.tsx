
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MercadoPagoRedirectProps {
  planId: string;
  planName: string;
  amount: number;
  userId: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function MercadoPagoRedirect({
  planId,
  planName,
  amount,
  userId,
  buttonText = 'Pagar com Mercado Pago',
  className = '',
  variant = 'default',
  onSuccess,
  onError
}: MercadoPagoRedirectProps) {
  const [redirectInfo, setRedirectInfo] = useState<{ preferenceId: string; checkoutUrl: string } | null>(null);
  
  const { 
    isLoading, 
    error, 
    createSubscriptionAndRedirect 
  } = useMercadoPago({
    onPaymentSuccess: (data) => {
      setRedirectInfo(data);
      if (onSuccess) onSuccess(data);
    },
    onPaymentError: (error) => {
      if (onError) onError(error);
    },
    redirectToSuccessPage: false // Não redirecionar automaticamente
  });

  const handlePayNow = async () => {
    try {
      const result = await createSubscriptionAndRedirect(
        planId,
        userId,
        amount,
        planName
      );
      
      // Se chegamos aqui, vamos redirecionar manualmente
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (err) {
      console.error('Erro ao iniciar pagamento:', err);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao processar pagamento</AlertTitle>
          <AlertDescription>
            {error.message || 'Ocorreu um erro ao iniciar o pagamento'}
          </AlertDescription>
        </Alert>
      )}
      
      {redirectInfo ? (
        <Button 
          className={className} 
          variant={variant}
          onClick={() => window.location.href = redirectInfo.checkoutUrl}
        >
          Continuar para o checkout
        </Button>
      ) : (
        <Button 
          className={className} 
          variant={variant}
          onClick={handlePayNow}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            buttonText
          )}
        </Button>
      )}
      
      <p className="text-xs text-center text-muted-foreground">
        Você será redirecionado para o site do Mercado Pago para finalizar seu pagamento com segurança.
      </p>
    </div>
  );
}

export default MercadoPagoRedirect;
