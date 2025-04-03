
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPlanCheckoutDialog } from "../checkout/BusinessPlanCheckoutDialog";
import { usePaymentStatusChecker } from "./usePaymentStatusChecker";
import { findOrCreateAsaasCustomer } from "./useAsaasCustomer";
import { createAsaasPayment, savePaymentData, PaymentResponse } from "./useAsaasPayment";
import { createBusinessSubscription, updateSubscriptionPaymentDetails } from "./useBusinessSubscription";

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

export function useBusinessPlanSubscription() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentData | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const { isVerifying: isVerifyingPayment, setIsVerifying: setIsVerifyingPayment } = usePaymentStatusChecker({
    paymentId: checkoutData?.paymentId,
    onPaymentConfirmed: () => {
      setShowCheckout(false);
    }
  });

  const handleSubscribe = async (planId: string, paymentMethod: string = "undefined", businessId?: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get business profile if not provided
      let businessProfileId = businessId;
      if (!businessProfileId) {
        const { data: businessProfile, error: businessError } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (businessError || !businessProfile) {
          throw new Error("Perfil de empresa não encontrado");
        }
        
        businessProfileId = businessProfile.id;
      }

      console.log("Criando assinatura de plano para empresa:", businessProfileId, "plano:", planId, "método de pagamento:", paymentMethod);

      // Get plan details
      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      // Get business profile for full info
      const { data: businessProfile, error: profileError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessProfileId)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil da empresa: ${profileError.message}`);
      }

      // Create or get Asaas customer
      const { asaasCustomerId, customerId } = await findOrCreateAsaasCustomer(
        user.id, 
        businessProfile
      );

      // Create subscription in the DB first
      const newSubscription = await createBusinessSubscription({
        businessId: businessProfileId,
        planId,
        userId: user.id,
        paymentMethod
      });

      // Create payment via payment link
      const paymentResponse: PaymentResponse = await createAsaasPayment({
        customer: asaasCustomerId,
        planName: planDetails.name,
        planCost: planDetails.monthly_cost,
        paymentMethod,
        subscriptionId: newSubscription.id
      });

      // Save payment data - using invoiceUrl field
      await savePaymentData({
        asaasId: paymentResponse.payment.id,
        customerId,
        subscriptionId: newSubscription.id,
        amount: paymentResponse.payment.value,
        billingType: paymentResponse.payment.billingType,
        status: paymentResponse.payment.status,
        dueDate: paymentResponse.payment.dueDate,
        invoiceUrl: paymentResponse.payment.invoiceUrl
      });

      // Update subscription with payment details
      await updateSubscriptionPaymentDetails({
        subscriptionId: newSubscription.id,
        paymentLink: paymentResponse.payment.invoiceUrl, // Use invoiceUrl here
        customerId: asaasCustomerId,
        paymentMethod,
        totalValue: planDetails.monthly_cost
      });

      // Prepare checkout data
      const checkoutData: PaymentData = {
        status: paymentResponse.payment.status,
        value: paymentResponse.payment.value,
        dueDate: paymentResponse.payment.dueDate,
        billingType: paymentResponse.payment.billingType,
        invoiceUrl: paymentResponse.payment.invoiceUrl,
        paymentId: paymentResponse.payment.id,
        paymentLink: paymentResponse.payment.paymentLink || paymentResponse.payment.invoiceUrl
      };

      setCheckoutData(checkoutData);
      
      toast({
        title: "Link de pagamento gerado!",
        description: "Você será redirecionado para a página de pagamento do Asaas."
      });

      // Redirect to payment link - using invoiceUrl which is always available
      const paymentUrl = paymentResponse.payment.invoiceUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        setShowCheckout(true);
        console.error("Link de pagamento não encontrado na resposta");
      }
      
      return newSubscription;
    } catch (error: any) {
      console.error("Erro ao assinar plano:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });

      // Clean up data in case of error
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 3000);
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
