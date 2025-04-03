
import { supabase } from "@/integrations/supabase/client";
import { savePaymentData } from "./useAsaasPayment";

export async function createSubscriptionRecord(userId: string, planId: string, paymentMethod: string) {
  try {
    // Normalize payment method to a valid enum value
    // Valid values should be: "pix", "credit_card", "boleto", "transfer", "debit_card"
    let normalizedPaymentMethod = paymentMethod.toLowerCase();
    
    // If it's "undefined", default to "pix" as a valid fallback
    if (normalizedPaymentMethod === "undefined") {
      normalizedPaymentMethod = "pix";
    }
    
    const { data: newSubscription, error: subscriptionError } = await supabase
      .from("user_plan_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        status: "pending",
        payment_status: "pending",
        payment_method: normalizedPaymentMethod  // Use normalized value
      })
      .select()
      .single();

    if (subscriptionError || !newSubscription) {
      throw new Error(`Erro ao criar assinatura: ${subscriptionError?.message || "Resposta inválida"}`);
    }
    
    return newSubscription;
  } catch (error) {
    console.error("Erro ao criar registro de assinatura:", error);
    throw error;
  }
}

export async function updateSubscriptionWithPaymentDetails(
  subscriptionId: string, 
  paymentUrl: string, 
  asaasCustomerId: string
) {
  try {
    const { error: updateError } = await supabase
      .from("user_plan_subscriptions")
      .update({
        asaas_payment_link: paymentUrl,
        asaas_customer_id: asaasCustomerId
      })
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("Erro ao atualizar assinatura com link de pagamento:", updateError);
    }
    return !updateError;
  } catch (updateError) {
    console.error("Erro ao atualizar assinatura com link de pagamento:", updateError);
    return false;
  }
}

export async function saveSubscriptionPaymentData(paymentInfo: any, subscriptionId: string) {
  try {
    await savePaymentData({
      asaasId: paymentInfo.paymentId,
      customerId: paymentInfo.customerId,
      subscriptionId: subscriptionId,
      amount: paymentInfo.value,
      billingType: paymentInfo.billingType,
      status: paymentInfo.status,
      dueDate: paymentInfo.dueDate,
      invoiceUrl: paymentInfo.invoiceUrl || paymentInfo.paymentLink || "" // Use either URL that's available
    });
    return true;
  } catch (saveError) {
    console.error("Erro ao salvar dados de pagamento:", saveError);
    return false;
  }
}
