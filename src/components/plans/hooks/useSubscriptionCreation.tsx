
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { findOrCreateAsaasCustomer } from "./useAsaasCustomer";
import { createAsaasPayment, savePaymentData } from "./useAsaasPayment";
import { BusinessPlanCheckoutDialog } from "../checkout/BusinessPlanCheckoutDialog";
import { usePaymentStatusChecker } from "./usePaymentStatusChecker";

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
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const { isVerifying: isVerifyingPayment, setIsVerifying: setIsVerifyingPayment } = usePaymentStatusChecker({
    paymentId: checkoutData?.paymentId,
    onPaymentConfirmed: () => {
      setShowCheckout(false);
    }
  });

  const handleSubscribe = async (planId: string, paymentMethod: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

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

      // Create or get Asaas customer
      const { asaasCustomerId, customerId } = await findOrCreateAsaasCustomer(
        user.id, 
        userProfile
      );

      console.log("Criando assinatura no Asaas:", {
        customer: asaasCustomerId,
        value: planDetails.monthly_cost,
        description: planDetails.description || planDetails.name,
        externalReference: ""
      });

      // Create subscription record in our database
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (subscriptionError || !newSubscription) {
        throw new Error(`Erro ao criar assinatura: ${subscriptionError?.message || "Resposta inválida"}`);
      }

      // Create payment link
      const paymentResponse = await createAsaasPayment({
        customer: asaasCustomerId,
        planName: planDetails.name,
        planCost: planDetails.monthly_cost,
        paymentMethod,
        subscriptionId: newSubscription.id
      });

      // Update subscription with payment link
      const { error: updateError } = await supabase
        .from("user_plan_subscriptions")
        .update({
          asaas_payment_link: paymentResponse.payment.invoiceUrl,
          asaas_customer_id: asaasCustomerId
        })
        .eq("id", newSubscription.id);

      if (updateError) {
        console.error("Erro ao atualizar assinatura com link de pagamento:", updateError);
      }

      // Save payment data
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

      // Prepare checkout data
      const checkoutData: PaymentData = {
        status: paymentResponse.payment.status,
        value: paymentResponse.payment.value,
        dueDate: paymentResponse.payment.dueDate,
        billingType: paymentResponse.payment.billingType,
        invoiceUrl: paymentResponse.payment.invoiceUrl,
        paymentId: paymentResponse.payment.id,
        paymentLink: paymentResponse.payment.paymentLink || paymentResponse.payment.invoiceUrl,
        pix: paymentResponse.pix
      };

      setCheckoutData(checkoutData);
      
      toast({
        title: "Link de pagamento gerado!",
        description: "Você será redirecionado para a página de pagamento."
      });

      // Redirect to payment link
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
