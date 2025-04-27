
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createBusinessSubscription } from "./useBusinessSubscription";
import { BusinessPlanCheckoutDialog } from "../checkout/BusinessPlanCheckoutDialog";

export function useBusinessPlanSubscription() {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const { toast } = useToast();

  const handleSubscribe = async (planId: string, paymentMethod: string) => {
    try {
      setIsSubscribing(true);

      // Criar nova assinatura sem cancelar as existentes
      const subscription = await createBusinessSubscription({
        planId,
        paymentMethod
      });

      if (!subscription) {
        throw new Error("Erro ao criar assinatura");
      }

      setCurrentSubscription(subscription);
      setShowCheckoutDialog(true);
      
      return subscription;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao assinar plano",
        description: error.message,
      });
      throw error;
    } finally {
      setIsSubscribing(false);
    }
  };

  const CheckoutDialog = () => (
    <BusinessPlanCheckoutDialog
      open={showCheckoutDialog}
      onOpenChange={setShowCheckoutDialog}
      subscription={currentSubscription}
    />
  );

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog,
  };
}
