import { useState, useEffect, useCallback } from 'react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/user';

// Verificar se estamos no modo sandbox
const isSandbox = process.env.NEXT_PUBLIC_MERCADO_PAGO_SANDBOX === 'true';

// Inicializar o SDK do Mercado Pago
initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '');

export interface BrickOptions {
  amount: number;
  payer?: {
    email?: string;
  };
  metadata?: Record<string, any>;
}

interface CardPaymentBrickController {
  mount: () => void;
  unmount: () => void;
  render: (containerId: string) => void;
}

export function useMercadoPagoPayment() {
  const [brickController, setBrickController] = useState<CardPaymentBrickController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initializeCardPaymentBrick = useCallback((containerId: string, options: BrickOptions) => {
    try {
      console.log(`Initializing Mercado Pago in ${isSandbox ? 'SANDBOX' : 'PRODUCTION'} mode`);
      setIsLoading(true);
      
      // Carregamos o script do Mercado Pago Bricks dinamicamente
      const loadBrickScript = () => {
        return new Promise<void>((resolve, reject) => {
          if ((window as any).MercadoPago) {
            console.log('MercadoPago SDK already loaded');
            resolve();
            return;
          }
          
          console.log('Loading MercadoPago SDK...');
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.onload = () => {
            console.log('MercadoPago SDK loaded successfully');
            resolve();
          };
          script.onerror = (error) => {
            console.error('Error loading MercadoPago SDK:', error);
            reject(error);
          };
          document.body.appendChild(script);
        });
      };
      
      // Função para criar o Brick
      const createBrick = async () => {
        await loadBrickScript();
        
        const mp = new (window as any).MercadoPago(
          process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '',
          { locale: 'pt-BR' }
        );
        
        const brickBuilder = mp.bricks();
        
        const renderComponent = async (brickId: string) => {
          await brickBuilder.create('cardPayment', brickId, {
            initialization: {
              amount: options.amount,
              payer: options.payer,
            },
            customization: {
              visual: {
                hideFormTitle: true,
                hidePaymentButton: false,
              },
            },
            callbacks: {
              onReady: () => {
                console.log('Brick ready');
                setIsLoading(false);
              },
              onSubmit: async (cardFormData: any) => {
                setIsLoading(true);
                try {
                  // Adicionar metadados ao payload
                  const formData = {
                    ...cardFormData,
                    metadata: options.metadata || {},
                  };
                  
                  // Enviar dados para o backend
                  const response = await fetch('/api/payments/process', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                  });
    
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Payment failed');
                  }
                  
                  const responseData = await response.json();
                  
                  // Disparar evento de sucesso
                  const successEvent = new CustomEvent('mercadopago:payment:success', {
                    detail: responseData
                  });
                  window.dispatchEvent(successEvent);
                  
                  return response.ok;
                } catch (error: any) {
                  console.error('Payment processing error:', error);
                  
                  // Disparar evento de erro
                  const errorEvent = new CustomEvent('mercadopago:payment:error', {
                    detail: error
                  });
                  window.dispatchEvent(errorEvent);
                  
                  toast({
                    title: 'Erro no pagamento',
                    description: error.message || 'Ocorreu um erro ao processar seu pagamento.',
                    variant: 'destructive',
                  });
                  return false;
                } finally {
                  setIsLoading(false);
                }
              },
              onError: (error: any) => {
                console.error('Brick error:', error);
                setIsLoading(false);
                toast({
                  title: 'Erro no checkout',
                  description: error.message || 'Ocorreu um erro no formulário de pagamento',
                  variant: 'destructive',
                });
              },
            },
          });
        };
        
        // Criar um controller personalizado
        const controller: CardPaymentBrickController = {
          mount: () => {},
          unmount: () => {
            try {
              console.log('Unmounting Mercado Pago Brick');
              // Não há método de unmount explícito na API do Bricks
              const brickContainer = document.getElementById(containerId);
              if (brickContainer) {
                brickContainer.innerHTML = '';
              }
            } catch (error) {
              console.error('Error unmounting Brick:', error);
            }
          },
          render: async (targetId: string) => {
            try {
              await renderComponent(targetId);
            } catch (error) {
              console.error('Error rendering Brick:', error);
              setIsLoading(false);
              toast({
                title: 'Erro ao carregar formulário',
                description: 'Não foi possível carregar o formulário de pagamento.',
                variant: 'destructive',
              });
            }
          }
        };
        
        setBrickController(controller);
        return controller;
      };
      
      return createBrick();
    } catch (error) {
      console.error('Error initializing Brick:', error);
      setIsLoading(false);
      toast({
        title: 'Erro de inicialização',
        description: 'Não foi possível inicializar o formulário de pagamento.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  useEffect(() => {
    return () => {
      if (brickController) {
        brickController.unmount();
      }
    };
  }, [brickController]);

  return {
    initializeCardPaymentBrick,
    isLoading,
  };
}
