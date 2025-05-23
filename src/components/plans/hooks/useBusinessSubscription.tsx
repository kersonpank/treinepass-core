
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPaymentDetails {
  subscriptionId: string;
  paymentLink: string;
  customerId: string;
  paymentMethod: string;
  totalValue: number;
}

export async function updateSubscriptionPaymentDetails(details: SubscriptionPaymentDetails) {
  try {
    const { error } = await supabase
      .from("business_plan_subscriptions")
      .update({
        asaas_payment_link: details.paymentLink,
        asaas_customer_id: details.customerId,
        payment_method: details.paymentMethod,
        total_value: details.totalValue,
        updated_at: new Date().toISOString()
      })
      .eq("id", details.subscriptionId);

    if (error) {
      console.error("Error updating subscription with payment details:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

export async function getBusinessPlanSubscription(subscriptionId: string) {
  try {
    const { data, error } = await supabase
      .from("business_plan_subscriptions")
      .select(`
        *,
        business_profiles(*),
        benefit_plans(*)
      `)
      .eq("id", subscriptionId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw error;
  }
}

export async function updateBusinessSubscriptionStatus(subscriptionId: string, status: string, paymentStatus: string) {
  try {
    // First, get the business ID from the subscription
    const { data: subscription, error: fetchError } = await supabase
      .from("business_plan_subscriptions")
      .select("business_id")
      .eq("id", subscriptionId)
      .single();
      
    if (fetchError || !subscription) {
      throw fetchError || new Error("Subscription not found");
    }
    
    // If activating a subscription, cancel all other pending subscriptions
    if (status === 'active' && paymentStatus === 'paid') {
      await supabase
        .from("business_plan_subscriptions")
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq("business_id", subscription.business_id)
        .neq("id", subscriptionId)
        .eq("status", "pending");
    }
    
    // Update the specified subscription
    const { error } = await supabase
      .from("business_plan_subscriptions")
      .update({
        status,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error updating subscription status:", error);
    throw error;
  }
}
