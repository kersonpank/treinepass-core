
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  customerId: string;
  planId: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX";
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { customerId, planId, billingType, creditCard } = await req.json() as PaymentRequest;

    // Buscar informações do plano
    const { data: plan } = await supabase
      .from("benefit_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    // Buscar informações do customer
    const { data: customer } = await supabase
      .from("asaas_customers")
      .select("asaas_id")
      .eq("id", customerId)
      .single();

    if (!customer) {
      throw new Error("Cliente não encontrado no Asaas");
    }

    // Criar pagamento no Asaas
    const paymentData = {
      customer: customer.asaas_id,
      billingType,
      value: plan.monthly_cost,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Amanhã
      description: `Pagamento do plano ${plan.name}`,
      ...(creditCard && billingType === "CREDIT_CARD" ? {
        creditCard: {
          holderName: creditCard.holderName,
          number: creditCard.number,
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv,
        },
      } : {}),
    };

    const asaasResponse = await fetch(
      "https://api.asaas.com/v3/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": Deno.env.get("ASAAS_API_KEY") || "",
        },
        body: JSON.stringify(paymentData),
      }
    );

    if (!asaasResponse.ok) {
      throw new Error("Erro ao criar pagamento no Asaas");
    }

    const asaasPayment = await asaasResponse.json();

    // Registrar pagamento no banco
    const { data: payment, error: paymentError } = await supabase
      .from("asaas_payments")
      .insert({
        asaas_id: asaasPayment.id,
        customer_id: customerId,
        amount: plan.monthly_cost,
        status: asaasPayment.status,
        due_date: paymentData.dueDate,
        billing_type: billingType,
        invoice_url: asaasPayment.invoiceUrl,
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    return new Response(
      JSON.stringify(payment),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
