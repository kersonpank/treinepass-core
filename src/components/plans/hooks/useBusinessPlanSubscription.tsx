
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BusinessPlanCheckoutDialog } from "../checkout/BusinessPlanCheckoutDialog";
import { usePaymentStatusChecker } from "./usePaymentStatusChecker";
import { useBusinessPlanCreation } from "./useBusinessPlanCreation";
import { useBusinessPaymentCreation } from "./useBusinessPaymentCreation";
import { useClipboard } from "./useClipboard";

export function useBusinessPlanSubscription() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const { copiedText, handleCopyToClipboard } = useClipboard();
  const { createBusinessSubscription } = useBusinessPlanCreation();
  const { createBusinessPayment, isProcessing } = useBusinessPaymentCreation();
  
  const { isVerifying: isVerifyingPayment, setIsVerifying: setIsVerifyingPayment } = usePaymentStatusChecker({
    paymentId: checkoutData?.paymentId,
    onPaymentConfirmed: () => {
      setShowCheckout(false);
    }
  });

  const handleSubscribe = async (planId: string, paymentMethod: string = "pix", businessId?: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      setIsSubscribing(true);
      
      // Ensure we have a valid payment method for database storage
      // while using UNDEFINED in the actual Asaas API call
      let effectivePaymentMethod = paymentMethod.toLowerCase();
      if (effectivePaymentMethod === "undefined") {
        effectivePaymentMethod = "pix"; // Default to pix as fallback for DB storage
      }
      
      // Step 1: Create subscription
      const { subscription, businessProfile, planDetails, asaasCustomerId } = await createBusinessSubscription(
        planId, 
        effectivePaymentMethod, 
        businessId
      );

      // Step 2: Create payment
      const paymentInfo = await createBusinessPayment(
        planDetails,
        subscription,
        asaasCustomerId,
        effectivePaymentMethod
      );

      // Set checkout data for the dialog
      setCheckoutData(paymentInfo);
      
      toast({
        title: "Link de pagamento gerado!",
        description: "Você será redirecionado para a página de pagamento do Asaas."
      });

      // Redirect to payment URL if available
      const paymentUrl = paymentInfo.paymentLink || paymentInfo.invoiceUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        setShowCheckout(true);
        console.error("Link de pagamento não encontrado na resposta");
      }
      
      return subscription;
    } catch (error: any) {
      console.error("Erro ao assinar plano:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });

      setCheckoutData(null);
      setShowCheckout(false);
      setIsVerifyingPayment(false);
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
