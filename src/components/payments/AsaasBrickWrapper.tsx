
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExclamationTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MercadoPagoBrick } from './MercadoPagoBrick';

interface AsaasBrickWrapperProps {
  planId: string;
  planName: string;
  amount: number;
  userId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  showSuccessRedirect?: boolean;
}

export function AsaasBrickWrapper({
  planId,
  planName,
  amount,
  userId,
  onSuccess,
  onError,
  showSuccessRedirect = true
}: AsaasBrickWrapperProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePaymentSuccess = () => {
    setStatus('success');
    toast({
      title: "Pagamento aprovado!",
      description: "Sua assinatura foi ativada com sucesso.",
      variant: "default",
    });
    
    if (onSuccess) {
      onSuccess();
    }
    
    if (showSuccessRedirect) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const handlePaymentError = (error: any) => {
    setStatus('error');
    setErrorMessage(error.message || 'Ocorreu um erro ao processar o pagamento');
    
    toast({
      title: "Erro no pagamento",
      description: error.message || 'Ocorreu um erro ao processar o pagamento',
      variant: "destructive",
    });
    
    if (onError) {
      onError(error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4 p-4 bg-muted rounded-md">
        <h3 className="text-lg font-medium">Detalhes do pagamento</h3>
        <p className="text-sm text-muted-foreground">Plano: {planName}</p>
        <p className="text-sm text-muted-foreground">Valor: R$ {amount.toFixed(2).replace('.', ',')}</p>
      </div>
      
      {status === 'processing' && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Processando pagamento...</p>
        </div>
      )}
      
      {status === 'success' && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-green-100 p-1">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span>Pagamento processado com sucesso! {showSuccessRedirect ? 'Redirecionando...' : ''}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {status === 'error' && (
        <Alert variant="destructive" className="mb-4">
          <ExclamationTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {status === 'idle' && (
        <MercadoPagoBrick
          amount={amount}
          payerEmail={undefined}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          metadata={{
            user_id: userId,
            plan_id: planId,
            plan_name: planName
          }}
        />
      )}
    </div>
  );
}

export default AsaasBrickWrapper;
