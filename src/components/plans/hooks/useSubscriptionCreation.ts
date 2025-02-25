
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (planId: string, paymentMethod: string) => {
    try {
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Primeiro criamos a assinatura como pending
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

      // 2. Criar o cliente e o pagamento no Asaas
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
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

      // 3. Verificar se recebemos o link de pagamento
      if (!paymentData?.paymentLink) {
        throw new Error("Link de pagamento não gerado");
      }

      toast({
        title: "Plano reservado!",
        description: "Você será redirecionado para realizar o pagamento.",
      });

      // 4. Redirecionar para o pagamento
      window.location.href = paymentData.paymentLink;
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

  return {
    isSubscribing,
    handleSubscribe
  };
}
