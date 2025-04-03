
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { findOrCreateAsaasCustomer } from "./useAsaasCustomer";
import { createBusinessSubscription } from "./useBusinessSubscription";

export function useBusinessPlanCreation() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createBusinessSubscription = async (planId: string, paymentMethod: string = "pix", businessId?: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      const effectivePaymentMethod = paymentMethod.toLowerCase();
      
      setIsCreating(true);
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

      const { asaasCustomerId } = await findOrCreateAsaasCustomer(
        user.id, 
        businessProfile
      );

      const newSubscription = await createSubscription({
        businessId: businessProfileId,
        planId,
        userId: user.id,
        paymentMethod: effectivePaymentMethod
      });

      return {
        subscription: newSubscription,
        businessProfile,
        planDetails,
        asaasCustomerId
      };

    } catch (error: any) {
      console.error("Erro ao criar assinatura de plano:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createBusinessSubscription,
    isCreating
  };
}

interface SubscriptionParams {
  businessId: string;
  planId: string;
  userId: string;
  paymentMethod: string;
}

// Helper function to create the subscription record
async function createSubscription(params: SubscriptionParams) {
  const { businessId, planId, userId, paymentMethod } = params;
  
  try {
    // Make sure we're using the correct column names according to the database
    const { data: newSubscription, error } = await supabase
      .from("business_plan_subscriptions")
      .insert({
        business_id: businessId,
        plan_id: planId,
        user_id: userId,
        start_date: new Date().toISOString(),
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro na criação da assinatura:", error);
      throw error;
    }

    console.log("Assinatura empresarial criada:", newSubscription);
    return newSubscription;
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    throw error;
  }
}
