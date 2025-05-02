
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Função para criar preferência de pagamento e redirecionar
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Criar objeto de preferência
      const preferenceData = {
        items: [
          {
            id: planId,
            title: planName,
            description: `Assinatura: ${planName}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: planValue
          }
        ],
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`
        },
        auto_return: 'approved',
        notification_url: `${window.location.origin}/api/webhooks/mercadopago`,
        external_reference: `plan_${planId}_user_${userId}`,
      };

      console.log('Iniciando checkout com dados:', preferenceData);

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
      console.log('Preferência criada com sucesso:', data);
      
      // Registrar checkout no banco de dados
      const registerResponse = await fetch('/api/mercadopago/register-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          preference_id: data.id,
          amount: planValue
        })
      });

      if (!registerResponse.ok) {
        console.warn('Aviso: Erro ao registrar checkout, mas continuando com pagamento');
      } else {
        console.log('Checkout registrado com sucesso');
      }

      // Determinar URL de checkout baseado no ambiente
      const isSandbox = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX === 'true';
      const checkoutUrl = isSandbox ? data.sandbox_init_point : data.init_point;

      if (onSuccess) {
        onSuccess({ preferenceId: data.id, checkoutUrl });
      }
      
      // Redirecionar para página de checkout do Mercado Pago
      console.log('Redirecionando para:', checkoutUrl);
      window.location.href = checkoutUrl;
      
    } catch (err: any) {
      console.error('Erro ao iniciar checkout:', err);
      setError(err);
      if (onError) {
        onError(err);
      }
      toast({
        title: 'Erro ao processar pagamento',
        description: err.message || 'Não foi possível iniciar o checkout',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-muted/50 p-4 rounded-md">
        <h3 className="font-medium">Detalhes do plano</h3>
        <p className="text-sm text-muted-foreground mt-1">Plano: {planName}</p>
        <p className="text-sm text-muted-foreground">Valor: R$ {planValue.toFixed(2).replace('.', ',')}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao processar pagamento</AlertTitle>
          <AlertDescription>
            {error.message || 'Ocorreu um erro ao iniciar o pagamento'}
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? (
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
