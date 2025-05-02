
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import MercadoPagoPayment from '@/components/payments/MercadoPagoPayment';

interface SubscribeButtonProps {
  planId: string;
  planName: string;
  planPrice: number;
  buttonText?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  redirectToCheckout?: boolean;
}

export function SubscribeButton({
  planId,
  planName,
  planPrice,
  buttonText = 'Assinar',
  disabled = false,
  variant = 'default',
  size = 'default',
  className = '',
  redirectToCheckout = true
}: SubscribeButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createSubscriptionAndRedirect } = useMercadoPago();

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Faça login ou cadastre-se para assinar um plano.",
      });
      navigate('/login', { state: { from: `/plans/${planId}` } });
      return;
    }

    if (redirectToCheckout) {
      setIsLoading(true);
      try {
        await createSubscriptionAndRedirect(
          planId,
          user.id,
          planPrice,
          planName
        );
      } catch (error) {
        console.error('Error redirecting to checkout:', error);
        setIsLoading(false);
      }
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handlePaymentSuccess = () => {
    setIsDialogOpen(false);
    toast({
      title: "Assinatura realizada",
      description: "Sua assinatura foi processada com sucesso.",
    });
    navigate('/dashboard');
  };

  const handlePaymentError = (error: any) => {
    toast({
      title: "Erro no pagamento",
      description: error.message || "Houve um erro ao processar seu pagamento. Tente novamente.",
      variant: "destructive",
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || isLoading}
        onClick={handleSubscribe}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar plano {planName}</DialogTitle>
            <DialogDescription>
              Complete o pagamento para ativar a sua assinatura.
            </DialogDescription>
          </DialogHeader>
          
          {user && (
            <MercadoPagoPayment
              planId={planId}
              planName={planName}
              amount={planPrice}
              userId={user.id}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              redirectAfterPayment={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SubscribeButton;
