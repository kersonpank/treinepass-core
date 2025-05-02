
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract payment data from URL params
  const paymentId = searchParams.get('payment_id');
  const preferenceId = searchParams.get('preference_id');
  const paymentStatus = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  
  useEffect(() => {
    // Verify payment status with our backend
    const verifyPayment = async () => {
      try {
        if (!paymentId) {
          setIsVerifying(false);
          return;
        }
        
        const response = await fetch(`/api/mercadopago/verify-payment?payment_id=${paymentId}`);
        
        if (!response.ok) {
          throw new Error('Não foi possível verificar o status do pagamento');
        }
        
        const data = await response.json();
        setPaymentDetails(data);
        
        if (data.status === 'approved') {
          toast({
            title: 'Pagamento aprovado!',
            description: 'Sua assinatura foi ativada com sucesso.',
          });
        } else if (data.status === 'pending' || data.status === 'in_process') {
          toast({
            title: 'Pagamento pendente',
            description: 'Seu pagamento está sendo processado.',
          });
        }
      } catch (error: any) {
        console.error('Erro ao verificar pagamento:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de verificação',
          description: error.message || 'Ocorreu um erro ao verificar o pagamento',
        });
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [paymentId, toast]);
  
  const handleGoToDashboard = () => {
    navigate('/app');
  };
  
  return (
    <div className="container mx-auto max-w-md mt-10 p-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>Pagamento {isVerifying ? 'Processando' : (paymentStatus === 'approved' ? 'Aprovado' : 'Recebido')}</CardTitle>
          <CardDescription>
            {isVerifying 
              ? 'Verificando status do pagamento...' 
              : (paymentStatus === 'approved' 
                ? 'Seu pagamento foi aprovado e sua assinatura está ativa.' 
                : 'Recebemos seu pagamento e estamos processando.')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-6">
          {isVerifying ? (
            <Loader2 className="h-20 w-20 text-primary animate-spin" />
          ) : (
            <CheckCircle className="h-20 w-20 text-green-500" />
          )}
          
          <div className="w-full space-y-2">
            {!isVerifying && paymentDetails && (
              <>
                <p className="text-sm text-center">
                  Identificação do pagamento: <span className="font-medium">{paymentId}</span>
                </p>
                <p className="text-sm text-center">
                  Status: <span className="font-medium">{paymentStatus}</span>
                </p>
              </>
            )}
            
            <Button className="w-full" onClick={handleGoToDashboard}>
              Ir para o Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
