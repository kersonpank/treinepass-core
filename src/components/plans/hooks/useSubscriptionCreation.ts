
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

      const { data: newSubscription, error } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      const response = await supabase.functions.invoke('asaas-api', {
        body: {
          userId: user.id,
          planId: planId,
          paymentMethod
        }
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Plano contratado!",
        description: "Você será redirecionado para realizar o pagamento.",
      });

      if (response.data?.subscription?.paymentLink) {
        window.location.href = response.data.subscription.paymentLink;
      }
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
