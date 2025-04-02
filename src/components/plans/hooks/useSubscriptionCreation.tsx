import * as React from "react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPlanCheckoutDialog } from "../checkout/BusinessPlanCheckoutDialog";
import { usePaymentStatusChecker } from "./usePaymentStatusChecker";

interface PaymentData {
  status: string;
  value: number;
  dueDate: string;
  billingType: string;
  invoiceUrl: string;
  paymentId: string;
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
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, paymentMethod: string = "undefined") => {
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

      // Verificar se o usuário já tem um cliente Asaas
      const { data: existingCustomer, error: customerError } = await supabase
        .from("asaas_customers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (customerError && customerError.code !== "PGRST116") {
        throw customerError;
      }

      let asaasCustomerId = existingCustomer?.asaas_id;

      // Se não existir, criar um novo cliente no Asaas
      if (!asaasCustomerId) {
        // Get user profile for full info
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
        }

        const { data: customerData, error: createCustomerError } = await supabase.functions.invoke(
          'asaas-api',
          {
            body: {
              action: "createCustomer",
              data: {
                name: userProfile.full_name || user.user_metadata.full_name,
                email: user.email,
                cpfCnpj: userProfile.cpf || user.user_metadata.cpf
              }
            }
          }
        );

        if (createCustomerError || !customerData?.id) {
          throw new Error(`Erro ao criar cliente no Asaas: ${createCustomerError?.message || "Resposta inválida"}`);
        }

        // Save customer data
        const { error: saveCustomerError } = await supabase
          .from("asaas_customers")
          .insert({
            user_id: user.id,
            asaas_id: customerData.id,
            name: userProfile.full_name || user.user_metadata.full_name,
            email: user.email,
            cpf_cnpj: userProfile.cpf || user.user_metadata.cpf
          });

        if (saveCustomerError) {
          throw saveCustomerError;
        }

        asaasCustomerId = customerData.id;
      }

      // Criar assinatura como pendente
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
        throw subscriptionError;
      }

      console.log("Subscription created:", newSubscription);

      // Criar link de pagamento via edge function
      const { data, error: paymentError } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "createPaymentLink",
            data: {
              customer: asaasCustomerId,
              billingType: "UNDEFINED", // Cliente escolhe no checkout do Asaas
              value: planDetails.monthly_cost,
              name: `Plano ${planDetails.name}`,
              description: `Assinatura do plano ${planDetails.name}`,
              dueDateLimitDays: 5,
              chargeType: "DETACHED",
              externalReference: newSubscription.id
            }
          }
        }
      );

      console.log("Payment link response:", data);

      if (paymentError) {
        console.error("Payment error:", paymentError);
        throw new Error(`Erro no processamento do pagamento: ${paymentError.message}`);
      }
      
      if (!data?.success) {
        console.error("Invalid payment response:", data);
        throw new Error('Falha ao criar pagamento: Resposta inválida do servidor');
      }

      // Save payment data
      const { error: savePaymentError } = await supabase
        .from("asaas_payments")
        .insert({
          asaas_id: data.id,
          customer_id: existingCustomer?.id,
          subscription_id: newSubscription.id,
          amount: data.value,
          billing_type: "UNDEFINED",
          status: "PENDING",
          due_date: data.dueDate,
          payment_link: data.paymentLink,
          external_reference: newSubscription.id
        });

      if (savePaymentError) {
        throw savePaymentError;
      }

      // Update subscription with payment link
      const { error: updateSubscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .update({
          asaas_payment_link: data.paymentLink,
          asaas_customer_id: asaasCustomerId,
          total_value: planDetails.monthly_cost
        })
        .eq("id", newSubscription.id);

      if (updateSubscriptionError) {
        throw updateSubscriptionError;
      }

      toast({
        title: "Link de pagamento gerado!",
        description: "Você será redirecionado para a página de pagamento do Asaas.",
      });

      // Redirect to payment link
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
      
      return;

    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });

      // Limpar dados em caso de erro
      setCheckoutData(null);
      setShowCheckout(false);
      setIsVerifyingPayment(false);
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

  // We keep the dialog component for backward compatibility but it will not be shown
  // since we're redirecting directly to Asaas payment page
  const CheckoutDialog = React.memo(() => (
    <BusinessPlanCheckoutDialog
      showCheckout={showCheckout}
      handleCloseCheckout={handleCloseCheckout}
      checkoutData={checkoutData}
      isVerifyingPayment={isVerifyingPayment}
      copiedText={copiedText}
      handleCopyToClipboard={handleCopyToClipboard}
    />
  ));

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog,
  };
}
