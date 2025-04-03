
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPlanCheckoutDialog } from "../checkout/BusinessPlanCheckoutDialog";
import { usePaymentStatusChecker } from "./usePaymentStatusChecker";
import { usePaymentCreation } from "./usePaymentCreation"; 
import { useClipboard } from "./useClipboard";
import { 
  createSubscriptionRecord, 
  saveSubscriptionPaymentData 
} from "./useSubscriptionUpdate";

interface PaymentData {
  status: string;
  value: number;
  dueDate: string;
  billingType: string;
  invoiceUrl: string;  // Using invoiceUrl consistently
  paymentId: string;
  paymentLink?: string;
  pix?: {
    encodedImage?: string;
    payload?: string;
  };
}

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentData | null>(null);
  
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

      // Store lowercase payment method in the database
      // The payment method is actually just for reference since we're using UNDEFINED
      // to allow the customer to choose the payment method in Asaas checkout
      const effectivePaymentMethod = paymentMethod.toLowerCase();
      console.log("Using payment method (reference only):", effectivePaymentMethod);
      
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get plan details
      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      // Get user profile for full info
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
      }

      // Create subscription record in our database
      const newSubscription = await createSubscriptionRecord(user.id, planId, effectivePaymentMethod);

      try {
        // Create payment using our payment hook
        const paymentInfo = await createPayment(
          user,
          userProfile,
          planDetails,
          newSubscription,
          effectivePaymentMethod
        );
        
        // Save payment data
        await saveSubscriptionPaymentData(paymentInfo, newSubscription.id);

        // Set checkout data for dialog display
        setCheckoutData({
          status: paymentInfo.status,
          value: paymentInfo.value,
          dueDate: paymentInfo.dueDate,
          billingType: paymentInfo.billingType,
          invoiceUrl: paymentInfo.invoiceUrl,
          paymentId: paymentInfo.paymentId,
          paymentLink: paymentInfo.paymentLink,
          pix: paymentInfo.pix
        });
        
        toast({
          title: "Link de pagamento gerado!",
          description: "Você será redirecionado para a página de pagamento."
        });

        // Redirect to payment link - use either available URL
        const redirectUrl = paymentInfo.paymentLink || paymentInfo.invoiceUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          setShowCheckout(true);
          console.error("Link de pagamento não encontrado na resposta");
        }
        
        return newSubscription;
      } catch (paymentError: any) {
        console.error("Erro ao processar pagamento:", paymentError);
        throw paymentError;
      }
    } catch (error: any) {
      console.error("Erro ao assinar plano:", error);
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

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog: () => (
      <BusinessPlanCheckoutDialog
        showCheckout={showCheckout}
        handleCloseCheckout={handleCloseCheckout}
        checkoutData={checkoutData}
        isVerifyingPayment={isVerifyingPayment}
        copiedText={copiedText}
        handleCopyToClipboard={handleCopyToClipboard}
      />
    ),
  };
}
