
import { supabase } from "@/integrations/supabase/client";

interface BusinessSubscriptionData {
  planId: string;
  paymentMethod: string;
}

export async function createBusinessSubscription(data: BusinessSubscriptionData) {
  try {
    // Normalizar o método de pagamento
    let normalizedPaymentMethod = data.paymentMethod.toLowerCase();
    if (normalizedPaymentMethod === "undefined") {
      normalizedPaymentMethod = "pix";
    }

    // Buscar o ID da empresa do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: businessProfile, error: businessError } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (businessError || !businessProfile) {
      throw new Error("Perfil da empresa não encontrado");
    }

    // Criar nova assinatura sem verificar ou cancelar outras existentes
    const { data: newSubscription, error } = await supabase
      .from("business_plan_subscriptions")
      .insert({
        business_id: businessProfile.id,
        plan_id: data.planId,
        user_id: user.id,
        start_date: new Date().toISOString(),
        status: "pending",
        payment_status: "pending",
        payment_method: normalizedPaymentMethod,
      })
      .select()
      .single();

    if (error) throw error;

    return newSubscription;
  } catch (error: any) {
    console.error("Erro ao criar assinatura:", error);
    throw error;
  }
}
