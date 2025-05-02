
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPendingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Extract data from URL params
  const paymentId = searchParams.get('payment_id');
  const preferenceId = searchParams.get('preference_id');
  
  useEffect(() => {
    toast({
      title: "Pagamento em processamento",
      description: "Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.",
    });
  }, [toast]);
  
  const handleGoToDashboard = () => {
    navigate('/app');
  };
  
  return (
    <div className="container mx-auto max-w-md mt-10 p-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-amber-500">Pagamento em processamento</CardTitle>
          <CardDescription>
            Seu pagamento foi recebido e está sendo processado.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-6">
          <Clock className="h-20 w-20 text-amber-500" />
          
          <div className="w-full space-y-4">
            <p className="text-sm text-center">
              Estamos aguardando a confirmação do seu pagamento. Este processo pode levar alguns minutos.
            </p>
            
            {paymentId && (
              <p className="text-sm text-center">
                Identificação do pagamento: <span className="font-medium">{paymentId}</span>
              </p>
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
