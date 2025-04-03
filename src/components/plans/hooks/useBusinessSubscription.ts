
import { supabase } from "@/integrations/supabase/client";

interface BusinessSubscriptionData {
  businessId: string;
  planId: string;
  userId: string;
  paymentMethod: string;
}

export async function createBusinessSubscription(data: BusinessSubscriptionData) {
  const { businessId, planId, userId, paymentMethod } = data;
  
  try {
    // Normalize payment method to a valid value
    // Valid values should be: "pix", "credit_card", "boleto", "transfer", "debit_card"
    let normalizedPaymentMethod = paymentMethod.toLowerCase();
    
    // If it's "undefined", default to "pix" as a valid fallback
    if (normalizedPaymentMethod === "undefined") {
      normalizedPaymentMethod = "pix";
    }
    
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
        payment_method: normalizedPaymentMethod,
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

interface SubscriptionUpdateData {
  subscriptionId: string;
  paymentLink: string;  // Using consistent naming
  customerId: string;
  paymentMethod: string;
  totalValue: number;
}

export async function updateSubscriptionPaymentDetails(data: SubscriptionUpdateData) {
  const { subscriptionId, paymentLink, customerId, paymentMethod, totalValue } = data;
  
  try {
    // Using asaas_payment_link which matches the DB schema
    const { error } = await supabase
      .from("business_plan_subscriptions")
      .update({
        asaas_payment_link: paymentLink,
        asaas_customer_id: customerId,
        payment_method: paymentMethod,
        total_value: totalValue
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("Erro ao atualizar detalhes de pagamento:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar detalhes de pagamento:", error);
    throw error;
  }
}
