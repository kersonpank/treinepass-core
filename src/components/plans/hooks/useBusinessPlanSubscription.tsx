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
  invoiceUrl: string;
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

  const handleSubscribe = async (planId: string, paymentMethod: string = "PIX", businessId?: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      const effectivePaymentMethod = paymentMethod.toLowerCase();
      
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

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

      console.log("Criando assinatura de plano para empresa:", businessProfileId, "plano:", planId, "método de pagamento:", effectivePaymentMethod);

      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      const { data: businessProfile, error: profileError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessProfileId)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil da empresa: ${profileError.message}`);
      }

      const { asaasCustomerId, customerId } = await findOrCreateAsaasCustomer(
        user.id, 
        businessProfile
      );

      const newSubscription = await createBusinessSubscription({
        businessId: businessProfileId,
        planId,
        userId: user.id,
        paymentMethod: effectivePaymentMethod
      });

      try {
        const paymentResponse: PaymentResponse = await createAsaasPayment({
          customer: asaasCustomerId,
          planName: planDetails.name,
          planCost: planDetails.monthly_cost,
          paymentMethod: effectivePaymentMethod,
          subscriptionId: newSubscription.id
        });
        
        console.log("Resposta do serviço de pagamento:", paymentResponse);
        
        if (!paymentResponse || (!paymentResponse.payment && !paymentResponse.paymentLink && !paymentResponse.id)) {
          throw new Error("Resposta de pagamento inválida ou incompleta");
        }

        let paymentStatus = "PENDING";
        let paymentValue = planDetails.monthly_cost;
        let paymentDueDate = new Date().toISOString().split('T')[0];
        let paymentId = "";
        let billingType = effectivePaymentMethod;
        let invoiceUrl = "";
        let paymentLinkUrl = "";
        let pixData = undefined;

        if (paymentResponse.payment) {
          paymentStatus = paymentResponse.payment.status;
          paymentValue = paymentResponse.payment.value;
          paymentDueDate = paymentResponse.payment.dueDate;
          paymentId = paymentResponse.payment.id;
          billingType = paymentResponse.payment.billingType;
          invoiceUrl = paymentResponse.payment.invoiceUrl;
          paymentLinkUrl = paymentResponse.payment.paymentLink || paymentResponse.payment.invoiceUrl;
          pixData = paymentResponse.pix;
        } else if (paymentResponse.paymentLink || paymentResponse.id) {
          paymentId = paymentResponse.id || "";
          paymentValue = paymentResponse.value || planDetails.monthly_cost;
          paymentDueDate = paymentResponse.dueDate || paymentDueDate;
          paymentLinkUrl = paymentResponse.paymentLink || "";
          invoiceUrl = paymentResponse.paymentLink || "";
        }

        await savePaymentData({
          asaasId: paymentId,
          customerId,
          subscriptionId: newSubscription.id,
          amount: paymentValue,
          billingType,
          status: paymentStatus,
          dueDate: paymentDueDate,
          invoiceUrl: invoiceUrl || paymentLinkUrl || ""
        });

        try {
          await updateSubscriptionPaymentDetails({
            subscriptionId: newSubscription.id,
            paymentLink: paymentLinkUrl || invoiceUrl || "",
            customerId: asaasCustomerId,
            paymentMethod: effectivePaymentMethod,
            totalValue: planDetails.monthly_cost
          });
        } catch (updateError) {
          console.error("Erro ao atualizar detalhes de pagamento:", updateError);
        }

        const checkoutData: PaymentData = {
          status: paymentStatus,
          value: paymentValue,
          dueDate: paymentDueDate,
          billingType,
          invoiceUrl: invoiceUrl || paymentLinkUrl || "",
          paymentId,
          paymentLink: paymentLinkUrl || invoiceUrl || "",
          pix: pixData
        };

        setCheckoutData(checkoutData);
        
        toast({
          title: "Link de pagamento gerado!",
          description: "Você será redirecionado para a página de pagamento do Asaas."
        });

        const paymentUrl = paymentLinkUrl || invoiceUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          setShowCheckout(true);
          console.error("Link de pagamento não encontrado na resposta");
        }
        
        return newSubscription;
      } catch (paymentError: any) {
        console.error("Erro ao criar pagamento:", paymentError);
        throw new Error(`Falha ao criar pagamento: ${paymentError.message}`);
      }
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
