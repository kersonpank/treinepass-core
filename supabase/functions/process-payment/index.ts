
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const asaasKey = Deno.env.get("ASAAS_API_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface PaymentRequest {
  customerId: string;
  planId: string;
  subscriptionType: "individual" | "corporate" | "corporate_subsidized";
  billingType?: string;
  dueDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { customerId, planId, subscriptionType, billingType, dueDate } = await req.json() as PaymentRequest;

    // Buscar informações do plano
    const { data: plan, error: planError } = await supabase
      .from("benefit_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError) throw new Error(`Erro ao buscar plano: ${planError.message}`);

    // Buscar configurações de pagamento do plano
    const { data: paymentSettings } = await supabase
      .from("plan_payment_settings")
      .select("*")
      .eq("plan_id", planId)
      .single();

    // Buscar cliente no Asaas
    const { data: customer } = await supabase
      .from("asaas_customers")
      .select("asaas_id")
      .eq("id", customerId)
      .single();

    if (!customer?.asaas_id) throw new Error("Cliente não encontrado no Asaas");

    // Calcular valor com base no tipo de assinatura
    let value = Number(plan.monthly_cost);
    if (subscriptionType === "corporate_subsidized") {
      const employeeContribution = (plan.financing_rules?.employee_contribution || 0);
      value = plan.financing_rules?.contribution_type === "percentage" 
        ? (value * employeeContribution) / 100
        : employeeContribution;
    }

    // Criar pagamento no Asaas
    const paymentData = {
      customer: customer.asaas_id,
      billingType: billingType || paymentSettings?.billing_type || "BOLETO",
      value: value,
      dueDate: dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: `Pagamento ${plan.name} - ${subscriptionType}`,
      cycle: plan.period_type === "monthly" ? "MONTHLY" : "YEARLY",
      maxPaymentAttempts: paymentSettings?.max_retry_attempts || 3,
      automatically: true
    };

    const asaasResponse = await fetch("https://api.asaas.com/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasKey
      },
      body: JSON.stringify(paymentData)
    });

    if (!asaasResponse.ok) {
      throw new Error(`Erro ao criar pagamento no Asaas: ${await asaasResponse.text()}`);
    }

    const asaasPayment = await asaasResponse.json();

    // Registrar pagamento no banco
    const { data: payment, error: paymentError } = await supabase
      .from("asaas_payments")
      .insert({
        customer_id: customerId,
        asaas_id: asaasPayment.id,
        amount: value,
        status: asaasPayment.status,
        due_date: paymentData.dueDate,
        billing_type: paymentData.billingType,
        subscription_type: subscriptionType,
        subscription_period: plan.period_type,
        next_due_date: new Date(paymentData.dueDate)
      })
      .select()
      .single();

    if (paymentError) throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);

    console.log("Pagamento criado com sucesso:", payment);

    return new Response(
      JSON.stringify({ success: true, payment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
