
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
  
  // Handle payment events
  const handlePaymentSuccess = useCallback((data: any) => {
    console.log('Payment success:', data);
    onPaymentSuccess?.();
  }, [onPaymentSuccess]);
  
  const handlePaymentError = useCallback((err: any) => {
    console.error('Payment error:', err);
    setError(err.message || 'Ocorreu um erro ao processar o pagamento');
    onPaymentError?.(err);
  }, [onPaymentError]);
  
  // Initialize payment brick when SDK is loaded
  useEffect(() => {
    if (!isLoaded || isSdkLoading) return;

    const initBrick = async () => {
      try {
        // Reset any previous errors
        setError(null);
        
        // Clear container
        const container = document.getElementById('brick-container');
        if (!container) {
          setError('Container do formulário não encontrado');
          return;
        }
        container.innerHTML = '';
        
        // Create payment brick
        await createCardPaymentBrick('brick-container', amount, {
          payerEmail,
          metadata,
          onReady: () => setIsProcessing(false),
          onError: handlePaymentError,
          onSubmit: async (formData: any) => {
            try {
              setIsProcessing(true);
              
              // Add metadata to payload
              const paymentData = {
                ...formData,
                metadata: metadata || {},
              };
              
              // Process payment
              const response = await processMercadoPagoPayment(
                paymentData, 
                amount,
                metadata
              );
              
              console.log('[MercadoPagoBrick] Payment response:', response);
              
              // If payment successful, update subscription in database
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
                  console.error('[MercadoPagoBrick] Database error:', dbError);
                  // Continue with success flow even if DB update fails
                }
                
                // Trigger success event
                handlePaymentSuccess(response);
                return true;
              }
              
              return false;
            } catch (error: any) {
              console.error('[MercadoPagoBrick] Payment processing error:', error);
              handlePaymentError(error);
              return false;
            } finally {
              setIsProcessing(false);
            }
          }
        });
      } catch (err: any) {
        console.error('Error initializing brick:', err);
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
  
  // Display loading state
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
