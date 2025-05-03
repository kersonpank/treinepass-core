
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { MercadoPagoCheckout } from '@/components/plans/checkout/MercadoPagoCheckout';

interface SubscribeButtonProps {
  planId: string;
  planName: string;
  planPrice: number;
  buttonText?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
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
}: SubscribeButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    console.log('handleSubscribeToPlan clicked:', { planId, planName, planPrice });
    
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Faça login ou cadastre-se para assinar um plano.",
      });
      navigate('/login', { state: { from: `/plans/${planId}` } });
      return;
    }

    // Abrir diálogo de checkout
    setIsDialogOpen(true);
  };

  const handlePaymentSuccess = (data: any) => {
    console.log('Pagamento iniciado com sucesso:', data);
    setIsDialogOpen(false);
    toast({
      title: "Redirecionando para pagamento",
      description: "Você será redirecionado para a página de pagamento do Mercado Pago.",
    });
  };

  const handlePaymentError = (error: any) => {
    console.error('Erro no pagamento:', error);
    toast({
      title: "Erro no pagamento",
      description: error.message || "Houve um erro ao processar seu pagamento. Tente novamente.",
      variant: "destructive",
    });
  };

  console.log('SubscribeButton render:', { planId, planName, planPrice, isDialogOpen });

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
            <MercadoPagoCheckout
              planId={planId}
              planName={planName}
              planValue={planPrice}
              userId={user.id}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
