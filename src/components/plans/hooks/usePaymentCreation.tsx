
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAsaasCheckout } from "@/hooks/useAsaasCheckout";

export function usePaymentCreation() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { createCheckoutSession } = useAsaasCheckout();

  const createPayment = async (
    user: any,
    userProfile: any,
    planDetails: any,
    newSubscription: any
  ) => {
    try {
      setIsProcessing(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuário não autenticado");

      // Get user profile for complete info
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
      }

      // Ensure we have the minimum required customer data
      if (!profile.full_name || !profile.cpf) {
        throw new Error("Dados de usuário incompletos. Nome e CPF são obrigatórios.");
      }

      console.log("Creating checkout with profile data:", {
        name: profile.full_name,
        cpf: profile.cpf,
        email: profile.email
      });

      // Format phone number properly if it exists
      const formattedPhone = profile.phone ? profile.phone.replace(/\D/g, '') : undefined;

      // Create checkout session
      const checkoutResponse = await createCheckoutSession({
        value: planDetails.monthly_cost,
        description: `Assinatura do plano ${planDetails.name}`,
        externalReference: newSubscription.id,
        customerData: {
          name: profile.full_name,
          cpfCnpj: profile.cpf,
          email: profile.email,
          phone: formattedPhone
        },
        successUrl: `${window.location.origin}/payment/success?subscription=${newSubscription.id}`,
        failureUrl: `${window.location.origin}/payment/failure?subscription=${newSubscription.id}`
      });

      if (!checkoutResponse.success) {
        throw new Error(checkoutResponse.error?.message || "Erro ao criar sessão de pagamento");
      }

      // Update subscription with payment link
      await supabase
        .from("user_plan_subscriptions")
        .update({
          asaas_payment_link: checkoutResponse.checkoutUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", newSubscription.id);

      return {
        success: true,
        checkoutUrl: checkoutResponse.checkoutUrl,
        ...checkoutResponse.checkoutData
      };

    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createPayment,
    isProcessing
  };
}
