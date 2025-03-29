
import { supabase } from "@/integrations/supabase/client";

export async function createBusinessSubscription(data: {
  businessId: string;
  planId: string;
  userId: string;
  paymentMethod: string;
}) {
  const { businessId, planId, userId, paymentMethod } = data;
  
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
    console.error("Subscription error:", error);
    throw error;
  }

  console.log("Assinatura empresarial criada:", newSubscription);
  return newSubscription;
}

export async function updateSubscriptionPaymentDetails(data: {
  subscriptionId: string;
  paymentLink: string;
  customerId: string;
  paymentMethod: string;
  totalValue: number;
}) {
  const { subscriptionId, paymentLink, customerId, paymentMethod, totalValue } = data;
  
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
    throw error;
  }
}
