
import { supabase } from "@/integrations/supabase/client";
import { findOrCreateAsaasCustomer } from "./useAsaasCustomer";

export function useBusinessPlanCreation() {
  const createBusinessSubscription = async (
    planId: string, 
    paymentMethod: string = "pix",
    businessId?: string
  ) => {
    if (!planId) {
      throw new Error("ID do plano não fornecido");
    }

    try {
      // Get user and business data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Get business profile (either the specified one or the user's own)
      let businessQuery = supabase
        .from("business_profiles")
        .select("*");
        
      if (businessId) {
        businessQuery = businessQuery.eq("id", businessId);
      } else {
        businessQuery = businessQuery.eq("user_id", user.id);
      }

      const { data: businessProfile, error: businessError } = await businessQuery.single();
      
      if (businessError || !businessProfile) {
        throw new Error("Erro ao buscar perfil da empresa");
      }

      // Get plan details
      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      // Create or get Asaas customer
      const { asaasCustomerId } = await findOrCreateAsaasCustomer(
        businessProfile.user_id,
        businessProfile
      );

      // Create business plan subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from("business_plan_subscriptions")
        .insert({
          business_id: businessProfile.id,
          plan_id: planId,
          user_id: user.id,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod
        })
        .select()
        .single();
      
      if (subscriptionError || !subscription) {
        throw new Error(`Erro ao criar assinatura: ${subscriptionError?.message || "Resposta inválida"}`);
      }

      return { 
        subscription, 
        businessProfile, 
        planDetails,
        asaasCustomerId
      };
    } catch (error: any) {
      console.error("Erro ao criar assinatura empresarial:", error);
      throw error;
    }
  };

  return { createBusinessSubscription };
}
