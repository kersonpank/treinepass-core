
import React, { useEffect, useRef, useState } from 'react';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MercadoPagoPaymentProps {
  planId: string;
  planName: string;
  amount: number;
  userId: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  redirectAfterPayment?: boolean;
}

export function MercadoPagoPayment({
  planId,
  planName,
  amount,
  userId,
  onSuccess,
  onError,
  redirectAfterPayment = true,
}: MercadoPagoPaymentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRenderBrick, setShouldRenderBrick] = useState(false);
  
  const { 
    isInitialized,
    isLoading,
    error,
    initPaymentBrick,
    createSubscriptionAndRedirect
  } = useMercadoPago({
    onPaymentSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onPaymentError: (error) => {
      if (onError) {
        onError(error);
      }
    },
    redirectToSuccessPage: redirectAfterPayment,
  });

  useEffect(() => {
    if (isInitialized && shouldRenderBrick && containerRef.current) {
      initPaymentBrick('mp-brick-container', amount, {
        plan_id: planId,
        plan_name: planName,
        user_id: userId
      });
    }
  }, [isInitialized, shouldRenderBrick, initPaymentBrick, amount, planId, planName, userId]);

  const handlePayWithRedirect = async () => {
    await createSubscriptionAndRedirect(planId, userId, amount, planName);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 p-4 bg-muted/50 rounded-md">
        <h3 className="font-medium">Detalhes do plano</h3>
        <p className="text-sm text-muted-foreground mt-1">Plano: {planName}</p>
        <p className="text-sm text-muted-foreground">Valor: R$ {amount.toFixed(2).replace('.', ',')}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error.message || 'Ocorreu um erro ao inicializar o pagamento'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="default"
            onClick={handlePayWithRedirect}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
              </>
            ) : (
              'Pagar com Mercado Pago'
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>
          
          {!shouldRenderBrick ? (
            <Button
              variant="outline"
              onClick={() => setShouldRenderBrick(true)}
              className="w-full"
            >
              Pagar com cartão de crédito
            </Button>
          ) : (
            <div className="border rounded-md p-4">
              <div 
                id="mp-brick-container" 
                className="min-h-[300px]" 
                ref={containerRef}
              >
                {isLoading && (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MercadoPagoPayment;
