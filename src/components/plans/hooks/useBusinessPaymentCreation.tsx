
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAsaasCheckout } from "@/hooks/useAsaasCheckout";
import { supabase } from "@/integrations/supabase/client";

export function useBusinessPaymentCreation() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { createCheckoutSession } = useAsaasCheckout();

  const createBusinessPayment = async (
    planDetails: any,
    subscription: any,
    businessProfile: any
  ) => {
    try {
      setIsProcessing(true);
      console.log("Criando pagamento para assinatura business:", subscription.id);
      
      // Define URLs de redirecionamento para sucesso e falha
      const returnSuccessUrl = `${window.location.origin}/payment/success?subscription=${subscription.id}&business=true`;
      const returnFailureUrl = `${window.location.origin}/payment/failure?subscription=${subscription.id}&business=true`;
      
      // Get business profile for complete info if needed
      if (!businessProfile && subscription.business_id) {
        const { data: profile, error: profileError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", subscription.business_id)
          .single();

        if (!profileError) {
          businessProfile = profile;
        }
      }

      if (!businessProfile || !businessProfile.company_name || !businessProfile.cnpj) {
        throw new Error("Dados de empresa incompletos. Nome e CNPJ são obrigatórios.");
      }

      // Format phone number properly if it exists
      const formattedPhone = businessProfile.phone ? businessProfile.phone.replace(/\D/g, '') : 
                             businessProfile.contact_phone ? businessProfile.contact_phone.replace(/\D/g, '') : undefined;
      
      // Format postal code properly
      let postalCode = typeof businessProfile.postal_code === 'string' ? businessProfile.postal_code : "00000000";
      postalCode = postalCode.replace(/\D/g, '');
      if (postalCode.length !== 8) {
        postalCode = "00000000";
      }

      // Create checkout session with clean data
      const checkoutResponse = await createCheckoutSession({
        value: planDetails.monthly_cost,
        description: `Assinatura empresarial do plano ${planDetails.name}`,
        externalReference: subscription.id,
        customerData: {
          name: businessProfile.company_name,
          cpfCnpj: businessProfile.cnpj,
          email: businessProfile.contact_email || businessProfile.email,
          phone: formattedPhone,
          // Add required address fields with default values
          address: typeof businessProfile.address === 'string' ? businessProfile.address : "Endereço não informado",
          addressNumber: businessProfile.address_number || "S/N",
          province: businessProfile.neighborhood || "Centro",
          postalCode: postalCode
        },
        successUrl: returnSuccessUrl,
        failureUrl: returnFailureUrl
      });

      if (!checkoutResponse.success) {
        throw new Error(checkoutResponse.error?.message || "Resposta de pagamento inválida ou incompleta");
      }

      // Update subscription with payment details
      await supabase
        .from("business_plan_subscriptions")
        .update({
          asaas_payment_link: checkoutResponse.checkoutUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id);

      // Return success data
      return {
        success: true,
        checkoutUrl: checkoutResponse.checkoutUrl
      };
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
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
    createBusinessPayment,
    isProcessing
  };
}
