
import * as React from "react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PaymentData = {
  status: string;
  identificationField?: string;
  value: number;
  dueDate: string;
  billingType: string;
  invoiceUrl?: string;
  paymentId: string;
};

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentData | null>(null);

  const handleSubscribe = async (planId: string, paymentMethod: string) => {
    try {
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Criar assinatura como pending
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // 2. Criar cliente e pagamento no Asaas
      const { data, error: paymentError } = await supabase.functions.invoke(
        'asaas-customer',
        {
          body: {
            subscriptionId: newSubscription.id,
            planId: planId,
            paymentMethod
          }
        }
      );

      if (paymentError) throw new Error(paymentError.message);
      
      if (!data?.success) {
        throw new Error('Falha ao criar pagamento');
      }

      // 3. Mostrar checkout em um modal
      console.log("Payment data received:", data);
      setCheckoutData(data.paymentData);
      setShowCheckout(true);

      toast({
        title: "Plano reservado!",
        description: "Por favor, complete o pagamento para ativar sua assinatura.",
      });
    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const CheckoutDialog: React.FC = () => (
    <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Finalizar Pagamento</DialogTitle>
          <DialogDescription>
            Complete o pagamento para ativar sua assinatura
          </DialogDescription>
        </DialogHeader>
        {checkoutData && (
          <div className="flex flex-col items-center space-y-4">
            {checkoutData.billingType === 'PIX' ? (
              <div className="text-center">
                <p className="text-lg font-semibold">PIX</p>
                <p className="mt-2">Copie o código abaixo para pagar:</p>
                <div className="p-4 bg-gray-100 rounded mt-2">
                  <code className="text-sm break-all">{checkoutData.identificationField}</code>
                </div>
                <button
                  onClick={() => {
                    if (checkoutData.identificationField) {
                      navigator.clipboard.writeText(checkoutData.identificationField);
                      toast({
                        title: "Código copiado!",
                        description: "Cole o código no seu aplicativo de pagamento.",
                      });
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  Copiar código
                </button>
              </div>
            ) : (
              checkoutData.invoiceUrl ? (
                <iframe
                  src={checkoutData.invoiceUrl}
                  className="w-full h-full min-h-[600px]"
                  style={{ height: "calc(80vh - 100px)" }}
                  frameBorder="0"
                />
              ) : (
                <div className="text-center text-red-500">
                  URL de pagamento não disponível
                </div>
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog
  };
}
