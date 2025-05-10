
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import { createMercadoPagoPayment, MercadoPagoPaymentRequest, mapUserToPayer } from '@/integrations/mercadopago';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePaymentStatusChecker } from '../hooks/usePaymentStatusChecker';
import { Badge } from '@/components/ui/badge';

interface MercadoPagoCheckoutProps {
  planId: string;
  planName: string;
  amount: number;
  userId: string;
  userProfile: any;
  onSuccess?: () => void;
}

export function MercadoPagoCheckout({
  planId,
  planName,
  amount,
  userId,
  userProfile,
  onSuccess
}: MercadoPagoCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use the payment status checker
  const { isVerifying, status } = usePaymentStatusChecker({
    paymentId,
    onPaymentConfirmed: onSuccess,
    checkInterval: 5000
  });

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // First register the checkout in our database
      const externalReference = `plan_${planId}_user_${userId}`;
      const { data: registerData, error: registerError } = await fetch('/api/mercadopago/register-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          amount: amount,
          preference_id: externalReference,
        }),
      }).then(res => res.json());

      if (registerError) {
        throw new Error('Erro ao registrar checkout: ' + registerError);
      }
      
      // Create Mercado Pago payment preference
      const paymentRequest: MercadoPagoPaymentRequest = {
        items: [
          {
            title: `Assinatura ${planName}`,
            unit_price: amount,
            quantity: 1,
          }
        ],
        payer: mapUserToPayer(userProfile),
        external_reference: externalReference,
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          pending: `${window.location.origin}/payment/pending`,
          failure: `${window.location.origin}/payment/failure`
        },
        notification_url: `${window.location.origin}/api/webhooks/mercadopago`
      };
      
      const paymentResponse = await createMercadoPagoPayment(paymentRequest);
      
      if (!paymentResponse || !paymentResponse.id) {
        throw new Error('Erro ao criar preferência de pagamento');
      }

      setPaymentId(paymentResponse.id);
      
      // Set the checkout URL based on environment
      const checkoutUrl = process.env.NODE_ENV === 'production' 
        ? paymentResponse.init_point 
        : paymentResponse.sandbox_init_point;
      
      setCheckoutUrl(checkoutUrl || null);
      
      // Open Mercado Pago checkout in a new window
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }

      toast({
        title: 'Pagamento iniciado',
        description: 'Redirecionando para o Mercado Pago para finalizar seu pagamento.',
      });
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao processar pagamento',
        description: error.message || 'Ocorreu um erro ao processar seu pagamento.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Pagar com Mercado Pago
          <Badge variant={status === 'confirmed' ? 'success' : 'outline'}>
            {status === 'confirmed' ? 'Pago' : isVerifying ? 'Aguardando' : 'Pendente'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Pague de forma rápida e segura utilizando o Mercado Pago, com múltiplas opções de pagamento.
        </p>
        
        {checkoutUrl && (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">
              A janela de pagamento foi aberta. Se não abrir automaticamente, clique no botão abaixo:
            </p>
            <Button 
              onClick={() => window.open(checkoutUrl, '_blank')}
              variant="outline"
              className="w-full"
            >
              Abrir Página de Pagamento
            </Button>
          </div>
        )}
        
        {isVerifying && (
          <div className="bg-muted p-3 rounded-md flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando status do pagamento...</span>
          </div>
        )}
        
        {!checkoutUrl && !isVerifying && (
          <Button 
            onClick={handlePayment} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar R$ {amount.toFixed(2)}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
