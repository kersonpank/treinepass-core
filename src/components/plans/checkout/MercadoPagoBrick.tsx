
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoBrickProps {
  amount: number;
  planId: string;
  userId: string;
  onPaymentCreated?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentSuccess?: (data: any) => void;
}

export function MercadoPagoBrick({
  amount,
  planId,
  userId,
  onPaymentCreated,
  onPaymentError,
  onPaymentSuccess,
}: MercadoPagoBrickProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const brickRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadMercadoPagoSDK = async () => {
      try {
        setIsLoading(true);

        // Fetch public key from our API
        const response = await fetch("/api/mercadopago/initialize");
        const { publicKey } = await response.json();

        if (!publicKey) {
          throw new Error("Failed to get Mercado Pago public key");
        }

        // Load Mercado Pago SDK if it's not already loaded
        if (!window.MercadoPago) {
          const script = document.createElement("script");
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          document.body.appendChild(script);

          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        // Initialize Mercado Pago
        const mp = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        });

        if (!brickRef.current) {
          throw new Error("Payment container not found");
        }

        // Create payment brick
        const bricksBuilder = mp.bricks();
        
        // Create external reference for this payment
        const externalReference = `plan_${planId}_user_${userId}_${Date.now()}`;

        // Register the payment in our database first
        await fetch('/api/mercadopago/register-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            plan_id: planId,
            amount: amount,
            preference_id: externalReference,
          }),
        });

        // Render the payment brick
        const paymentBrickController = await bricksBuilder.create("payment", "payment-brick-container", {
          initialization: {
            amount: amount,
            payer: {
              email: "test@test.com", // This will be replaced by the form
            },
          },
          customization: {
            visual: {
              hideFormTitle: true,
              hidePaymentButton: false,
            },
            paymentMethods: {
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              setIsLoading(false);
              console.log("Brick ready");
            },
            onError: (error: any) => {
              console.error("Brick error:", error);
              setIsError(true);
              
              toast({
                variant: "destructive",
                title: "Erro ao carregar pagamento",
                description: "Não foi possível inicializar o formulário de pagamento.",
              });
              
              if (onPaymentError) onPaymentError(error);
            },
            onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
              try {
                // Process payment
                const response = await fetch('/api/payments/process', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...formData,
                    transaction_amount: amount,
                    description: `Plano ${planId}`,
                    metadata: {
                      user_id: userId,
                      plan_id: planId,
                    },
                    external_reference: externalReference,
                  }),
                });

                const responseData = await response.json();
                
                if (!response.ok) {
                  throw new Error(responseData.message || 'Erro ao processar pagamento');
                }
                
                if (onPaymentCreated) {
                  onPaymentCreated(responseData);
                }
                
                // Check payment status
                if (responseData.payment?.status === 'approved') {
                  if (onPaymentSuccess) {
                    onPaymentSuccess(responseData);
                  }
                  
                  toast({
                    title: "Pagamento aprovado!",
                    description: "Sua assinatura foi ativada.",
                  });
                } else {
                  // Payment is pending or requires additional action
                  toast({
                    title: "Pagamento em processamento",
                    description: "Aguarde a confirmação do pagamento.",
                  });
                  
                  // Redirect to status page if it's a pending payment
                  if (responseData.payment?.status === 'pending' || responseData.payment?.status === 'in_process') {
                    window.location.href = `/payment/pending?payment_id=${responseData.payment.id}`;
                  }
                }
                
                return responseData;
              } catch (error: any) {
                console.error('Error processing payment:', error);
                
                toast({
                  variant: "destructive",
                  title: "Erro no pagamento",
                  description: error.message || 'Ocorreu um erro ao processar seu pagamento.',
                });
                
                if (onPaymentError) {
                  onPaymentError(error);
                }
                
                return { error: true };
              }
            },
          },
        });

      } catch (error: any) {
        console.error("Error loading Mercado Pago:", error);
        setIsError(true);
        setIsLoading(false);
        
        toast({
          variant: "destructive",
          title: "Erro ao carregar Mercado Pago",
          description: error.message || "Não foi possível carregar o formulário de pagamento.",
        });
      }
    };

    loadMercadoPagoSDK();
  }, [amount, planId, userId, onPaymentCreated, onPaymentError, onPaymentSuccess, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagar com Mercado Pago</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {isError && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            Erro ao carregar o formulário de pagamento. Por favor, tente novamente.
          </div>
        )}
        
        <div id="payment-brick-container" ref={brickRef}></div>
      </CardContent>
    </Card>
  );
}
