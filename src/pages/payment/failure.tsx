
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract data from URL params
  const paymentId = searchParams.get('payment_id');
  const errorMessage = searchParams.get('error') || 'Ocorreu um problema com o seu pagamento';
  
  const handleTryAgain = () => {
    navigate('/app');
  };
  
  return (
    <div className="container mx-auto max-w-md mt-10 p-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">Pagamento não concluído</CardTitle>
          <CardDescription>
            Não foi possível processar o seu pagamento.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-6">
          <AlertCircle className="h-20 w-20 text-destructive" />
          
          <div className="w-full space-y-4">
            <p className="text-sm text-center">
              {errorMessage}
            </p>
            
            {paymentId && (
              <p className="text-sm text-center">
                Identificação do pagamento: <span className="font-medium">{paymentId}</span>
              </p>
            )}
            
            <Button className="w-full" onClick={handleTryAgain}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
