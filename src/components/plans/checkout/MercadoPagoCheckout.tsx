
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { Card } from '@/components/ui/card';

interface MercadoPagoCheckoutProps {
  planId: string;
  planName: string;
  planValue: number;
  userId: string;
  onSuccess?: (data: any) => void;
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
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const { toast } = useToast();
  
  const {
    isInitialized,
    isLoading,
    error,
    initPaymentBrick,
    createSubscriptionAndRedirect
  } = useMercadoPago({
    onPaymentSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onPaymentError: (error) => {
      if (onError) onError(error);
    },
    redirectToSuccessPage: true,
  });

  useEffect(() => {
    if (isInitialized && !paymentInitialized) {
      const container = document.getElementById('mp-brick-container');
      if (container) {
        setPaymentInitialized(true);
        initPaymentBrick('mp-brick-container', planValue, {
          plan_id: planId,
          plan_name: planName,
          user_id: userId
        });
      }
    }
  }, [isInitialized, paymentInitialized, planValue, planId, planName, userId, initPaymentBrick]);

  const handlePayWithRedirect = async () => {
    try {
      await createSubscriptionAndRedirect(
        planId, 
        userId, 
        planValue, 
        `Assinatura do plano ${planName}`
      );
    } catch (error) {
      console.error('Error redirecting to payment:', error);
      toast({
        variant: "destructive",
        title: "Erro ao redirecionar para pagamento",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
      
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="mb-6 p-4 bg-muted/50 rounded-md">
        <h3 className="font-medium">Detalhes do plano</h3>
        <p className="text-sm text-muted-foreground mt-1">Plano: {planName}</p>
        <p className="text-sm text-muted-foreground">Valor: R$ {planValue.toFixed(2).replace('.', ',')}/mês</p>
      </div>

      <Button
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

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou preencha os dados abaixo</span>
        </div>
      </div>

      <Card className="p-4 min-h-[300px]">
        <div id="mp-brick-container" className="mp-brick-container">
          {(!isInitialized || isLoading) && (
            <div className="flex flex-col items-center justify-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Carregando método de pagamento...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center text-destructive p-4">
              <p>Erro ao carregar o método de pagamento</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
