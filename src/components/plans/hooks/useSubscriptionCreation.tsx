
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

  const handleSubscribe = async (planId: string, paymentMethod: string = "PIX") => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      // Map payment method to match the database enum
      // We need to use 'pix' lowercase to match the enum values in the database
      const effectivePaymentMethod = paymentMethod && paymentMethod !== "undefined" ? paymentMethod.toLowerCase() : "pix";
      console.log("Using payment method:", effectivePaymentMethod);
      
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

      // Get user profile for full info - FIXED: using id instead of user_id
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
          payment_method: effectivePaymentMethod  // Make sure this matches the enum in the database
        })
        .select()
        .single();

      if (subscriptionError || !newSubscription) {
        throw new Error(`Erro ao criar assinatura: ${subscriptionError?.message || "Resposta inválida"}`);
      }

      try {
        // Create payment link
        const paymentResponse = await createAsaasPayment({
          customer: asaasCustomerId,
          planName: planDetails.name,
          planCost: planDetails.monthly_cost,
          paymentMethod: effectivePaymentMethod,
          subscriptionId: newSubscription.id
        });

        console.log("Resposta do serviço de pagamento:", paymentResponse);
        
        // Check for valid response - Support both payment object and direct paymentLink responses
        if (!paymentResponse || (!paymentResponse.payment && !paymentResponse.paymentLink && !paymentResponse.id)) {
          throw new Error("Resposta de pagamento vazia ou inválida");
        }
        
        // Set defaults for response parsing
        let paymentStatus = "PENDING";
        let paymentValue = planDetails.monthly_cost;
        let paymentDueDate = new Date().toISOString().split('T')[0];
        let paymentId = "";
        let billingType = effectivePaymentMethod;
        let invoiceUrl = "";
        let paymentLinkUrl = "";
        let pixData = undefined;

        // Handle different response formats
        if (paymentResponse.payment) {
          // Standard payment response with payment object
          paymentStatus = paymentResponse.payment.status;
          paymentValue = paymentResponse.payment.value;
          paymentDueDate = paymentResponse.payment.dueDate;
          paymentId = paymentResponse.payment.id;
          billingType = paymentResponse.payment.billingType;
          invoiceUrl = paymentResponse.payment.invoiceUrl;
          paymentLinkUrl = paymentResponse.payment.paymentLink || paymentResponse.payment.invoiceUrl;
          pixData = paymentResponse.pix;
        } else if (paymentResponse.paymentLink || paymentResponse.id) {
          // Direct payment link response
          paymentId = paymentResponse.id || "";
          paymentValue = paymentResponse.value || planDetails.monthly_cost;
          paymentDueDate = paymentResponse.dueDate || paymentDueDate;
          paymentLinkUrl = paymentResponse.paymentLink || "";
          invoiceUrl = paymentLinkUrl; // Use paymentLink as invoiceUrl
        }

        // Update subscription with payment link - use either one that's available
        const paymentUrl = paymentLinkUrl || invoiceUrl;
        if (paymentUrl) {
          try {
            const { error: updateError } = await supabase
              .from("user_plan_subscriptions")
              .update({
                asaas_payment_link: paymentUrl,
                asaas_customer_id: asaasCustomerId
              })
              .eq("id", newSubscription.id);

            if (updateError) {
              console.error("Erro ao atualizar assinatura com link de pagamento:", updateError);
            }
          } catch (updateError) {
            console.error("Erro ao atualizar assinatura com link de pagamento:", updateError);
            // Continue execution even if update fails
          }
        } else {
          console.warn("Nenhum URL de pagamento encontrado na resposta");
        }

        // Save payment data with available information
        try {
          await savePaymentData({
            asaasId: paymentId,
            customerId,
            subscriptionId: newSubscription.id,
            amount: paymentValue,
            billingType: billingType,
            status: paymentStatus,
            dueDate: paymentDueDate,
            invoiceUrl: invoiceUrl || paymentLinkUrl || "" // Use either URL that's available
          });
        } catch (saveError) {
          console.error("Erro ao salvar dados de pagamento:", saveError);
          // Continue execution even if save fails
        }

        // Prepare checkout data with all available information
        const checkoutData: PaymentData = {
          status: paymentStatus,
          value: paymentValue,
          dueDate: paymentDueDate,
          billingType: billingType,
          invoiceUrl: invoiceUrl || paymentLinkUrl || "", // Use either URL that's available
          paymentId: paymentId,
          paymentLink: paymentLinkUrl || invoiceUrl || "", // Use either URL that's available
          pix: pixData
        };

        setCheckoutData(checkoutData);
        
        toast({
          title: "Link de pagamento gerado!",
          description: "Você será redirecionado para a página de pagamento."
        });

        // Redirect to payment link - use either available URL
        const redirectUrl = paymentLinkUrl || invoiceUrl;
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
