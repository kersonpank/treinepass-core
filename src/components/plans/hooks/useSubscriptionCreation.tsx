
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentStatusChecker } from "./usePaymentStatusChecker";
import { usePaymentCreation } from "./usePaymentCreation"; 
import { useClipboard } from "./useClipboard";
import { CheckoutDialog } from "../checkout/CheckoutDialog";

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("pix");
  
  const { copiedText, handleCopyToClipboard } = useClipboard();
  const { createPayment } = usePaymentCreation();
  
  const { isVerifying: isVerifyingPayment, setIsVerifying: setIsVerifyingPayment } = usePaymentStatusChecker({
    paymentId: checkoutData?.paymentId,
    onPaymentConfirmed: () => {
      setShowCheckout(false);
    }
  });

  const handleSubscribe = async (planId: string, paymentMethod: string = "pix") => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      setIsSubscribing(true);
      setSelectedPaymentMethod(paymentMethod);
      
      // Verificar autenticação do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar detalhes do plano
      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      // Buscar perfil do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
      }

      // Armazenar o plano selecionado para uso posterior
      setSelectedPlan(planDetails);
      
      // Mostrar diálogo de checkout
      setCheckoutData({
        planId,
        planName: planDetails.name,
        planValue: planDetails.monthly_cost,
        open: true,
        paymentMethod: paymentMethod
      });
      setShowCheckout(true);
      
      return { planId, planDetails, userProfile };
    } catch (error: any) {
      console.error("Erro ao preparar assinatura:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });
      return null;
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setIsVerifyingPayment(false);
  };

  const handleSelectPaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  return {
    isSubscribing,
    handleSubscribe,
    selectedPaymentMethod,
    onPaymentMethodChange: handleSelectPaymentMethod,
    CheckoutDialog: () => (
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={handleCloseCheckout}
        planId={checkoutData?.planId || ""}
        planName={checkoutData?.planName || ""}
        planValue={checkoutData?.planValue || 0}
        paymentMethod={selectedPaymentMethod}
      />
    ),
  };
}
