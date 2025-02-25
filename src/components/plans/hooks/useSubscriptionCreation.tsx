
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

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const handleSubscribe = async (planId: string) => {
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
          status: "pending"
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
            planId: planId
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
        title: "Redirecionando para o pagamento",
        description: "Complete o pagamento para ativar sua assinatura.",
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

  const CheckoutDialog = React.memo(() => (
    <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Finalizar Pagamento</DialogTitle>
          <DialogDescription>
            Complete o pagamento para ativar sua assinatura
          </DialogDescription>
        </DialogHeader>
        {checkoutData && checkoutData.invoiceUrl ? (
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
        )}
      </DialogContent>
    </Dialog>
  ));

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog
  };
}
