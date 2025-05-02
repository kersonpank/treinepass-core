
import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useMercadoPagoSdk } from '@/hooks/useMercadoPagoSdk';
import { 
  createCardPaymentBrick,
  processMercadoPagoPayment,
  updateSubscriptionAfterPayment
} from '@/services/mercadoPagoService';

interface MercadoPagoBrickProps {
  amount: number;
  payerEmail?: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: any) => void;
  metadata?: Record<string, any>;
}

export function MercadoPagoBrick({
  amount,
  payerEmail,
  onPaymentSuccess,
  onPaymentError,
  metadata = {}
}: MercadoPagoBrickProps) {
  const { isLoaded, isLoading: isSdkLoading, error: sdkError } = useMercadoPagoSdk();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(sdkError?.message || null);
  const brickContainerRef = useRef<HTMLDivElement>(null);
  
  // Manipular eventos de pagamento
  const handlePaymentSuccess = useCallback((data: any) => {
    console.log('Pagamento realizado com sucesso:', data);
    onPaymentSuccess?.();
  }, [onPaymentSuccess]);
  
  const handlePaymentError = useCallback((err: any) => {
    console.error('Erro no pagamento:', err);
    setError(err.message || 'Ocorreu um erro ao processar o pagamento');
    onPaymentError?.(err);
  }, [onPaymentError]);
  
  // Inicializar o brick de pagamento quando o SDK estiver carregado
  useEffect(() => {
    if (!isLoaded || isSdkLoading) return;

    const initBrick = async () => {
      try {
        // Resetar erros anteriores
        setError(null);
        
        // Limpar container
        const container = document.getElementById('brick-container');
        if (!container) {
          setError('Container do formulário não encontrado');
          return;
        }
        container.innerHTML = '';
        
        // Criar brick de pagamento
        await createCardPaymentBrick('brick-container', amount, {
          payerEmail,
          metadata,
          onReady: () => setIsProcessing(false),
          onError: handlePaymentError,
          onSubmit: async (formData: any) => {
            try {
              setIsProcessing(true);
              
              // Adicionar metadados ao payload
              const paymentData = {
                ...formData,
                metadata: metadata || {},
              };
              
              // Processar pagamento
              const response = await processMercadoPagoPayment(
                paymentData, 
                amount,
                metadata
              );
              
              console.log('[MercadoPagoBrick] Resposta do pagamento:', response);
              
              // Se pagamento bem-sucedido, atualizar assinatura no banco de dados
              if (response.success && response.payment) {
                try {
                  if (metadata.user_id && metadata.plan_id) {
                    await updateSubscriptionAfterPayment(
                      metadata.user_id,
                      metadata.plan_id,
                      response.payment.id,
                      amount
                    );
                  }
                } catch (dbError) {
                  console.error('[MercadoPagoBrick] Erro de banco de dados:', dbError);
                  // Continuar com fluxo de sucesso mesmo se atualização do BD falhar
                }
                
                // Disparar evento de sucesso
                handlePaymentSuccess(response);
                return true;
              }
              
              return false;
            } catch (error: any) {
              console.error('[MercadoPagoBrick] Erro ao processar pagamento:', error);
              handlePaymentError(error);
              return false;
            } finally {
              setIsProcessing(false);
            }
          }
        });
      } catch (err: any) {
        console.error('Erro ao inicializar brick:', err);
        setError(err.message || 'Não foi possível inicializar o formulário de pagamento');
      }
    };
    
    initBrick();
    
    // Cleanup
    return () => {
      const container = document.getElementById('brick-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isLoaded, isSdkLoading, amount, payerEmail, metadata, handlePaymentSuccess, handlePaymentError]);
  
  // Exibir estado de carregamento
  const showLoading = isSdkLoading || !isLoaded || isProcessing;
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        id="brick-container" 
        className="w-full border border-gray-200 rounded-md p-4 mb-4" 
        ref={brickContainerRef}
        style={{ minHeight: '350px' }}
      ></div>
      
      {showLoading && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>{isProcessing ? "Processando pagamento..." : "Carregando formulário..."}</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}

export default MercadoPagoBrick;
