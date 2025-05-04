
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useMercadoPago } from '@/hooks/useMercadoPago';

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
  onError
}: MercadoPagoCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const { 
    createSubscriptionAndRedirect, 
    isLoading: isMercadoPagoLoading,
    error: mercadoPagoError
  } = useMercadoPago({
    onPaymentSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onPaymentError: (error) => {
      if (onError) onError(error);
    },
    // Não redirecionar automaticamente
    redirectToSuccessPage: false
  });

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      
      console.log("[MercadoPagoCheckout] Iniciando checkout para:", {
        planId, userId, planValue, planName
      });
      
      // Criar preferência e redirecionar
      const { success, checkoutUrl } = await createSubscriptionAndRedirect(
        planId,
        userId,
        planValue,
        planName
      );
      
      if (!success || !checkoutUrl) {
        throw new Error("Não foi possível criar a preferência de pagamento");
      }
      
      // Redirecionar para o checkout
      window.location.href = checkoutUrl;
      
    } catch (error: any) {
      console.error('Erro no processo de checkout:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Ocorreu um erro ao iniciar o pagamento',
        variant: 'destructive',
      });
      
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-muted/50 p-4 rounded-md">
        <h3 className="font-medium">Detalhes do plano</h3>
        <p className="text-sm text-muted-foreground mt-1">Plano: {planName}</p>
        <p className="text-sm text-muted-foreground">Valor: R$ {planValue.toFixed(2).replace('.', ',')}</p>
      </div>

      {mercadoPagoError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao conectar com Mercado Pago</AlertTitle>
          <AlertDescription>
            {mercadoPagoError.message || 'Ocorreu um erro ao inicializar o serviço de pagamento'}
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        onClick={handleCheckout}
        disabled={isProcessing || isMercadoPagoLoading}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          'Pagar com Mercado Pago'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Você será redirecionado para o site do Mercado Pago para concluir seu pagamento com segurança.
      </p>
    </div>
  );
}
