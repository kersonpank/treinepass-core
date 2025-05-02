
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse error information from URL
  const searchParams = new URLSearchParams(location.search);
  const errorMessage = searchParams.get('error_message') || 'Ocorreu um erro durante o processamento do pagamento.';
  const planId = searchParams.get('plan_id');

  const handleGoBack = () => {
    if (planId) {
      navigate(`/plans/${planId}`);
    } else {
      navigate('/plans');
    }
  };

  const handleTryAgain = () => {
    if (planId) {
      navigate(`/plans/${planId}/checkout`);
    } else {
      navigate('/plans');
    }
  };

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Falha no pagamento</CardTitle>
          <CardDescription>
            Não foi possível processar seu pagamento.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="rounded-md bg-red-50 border border-red-100 p-4 text-red-800">
            <p className="font-medium">Detalhes do erro</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Recomendamos verificar seus dados de pagamento e tentar novamente.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          
          <Button 
            className="w-full" 
            onClick={handleTryAgain}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
