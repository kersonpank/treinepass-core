
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, subscriptionId, userId, planId, paymentMethod } = await req.json()

    if (action !== "createPayment") {
      throw new Error("Invalid action")
    }

    console.log("Creating payment for subscription:", { subscriptionId, userId, planId, paymentMethod });

    // 1. Obter dados do plano
    const { data: plan, error: planError } = await supabaseClient
      .from('benefit_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error("Error fetching plan:", planError);
      throw new Error("Plan not found");
    }

    console.log("Plan data:", plan);

    // 2. Obter ou criar cliente no Asaas
    const { data: userProfile, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error("Error fetching user profile:", userError);
      throw new Error("User profile not found");
    }

    console.log("User profile:", userProfile);

    let asaasCustomerId

    // Verificar se já existe um customer_id
    const { data: existingCustomer } = await supabaseClient
      .from('asaas_customers')
      .select('asaas_id')
      .eq('user_id', userId)
      .single()

    if (existingCustomer) {
      asaasCustomerId = existingCustomer.asaas_id
      console.log("Using existing Asaas customer:", asaasCustomerId);
    } else {
      console.log("Creating new Asaas customer");
      // Criar novo cliente no Asaas
      const customerResponse = await fetch(`${ASAAS_SANDBOX_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': Deno.env.get('ASAAS_API_KEY') ?? '',
        },
        body: JSON.stringify({
          name: userProfile.full_name,
          email: userProfile.email,
          cpfCnpj: userProfile.cpf,
          phone: userProfile.phone_number,
        }),
      })

      const customerData = await customerResponse.json()
      console.log("Asaas customer response:", customerData);

      if (!customerData.id) {
        console.error("Failed to create Asaas customer:", customerData);
        throw new Error("Failed to create Asaas customer");
      }

      // Salvar customer_id
      const { error: customerSaveError } = await supabaseClient
        .from('asaas_customers')
        .insert({
          user_id: userId,
          asaas_id: customerData.id,
          name: userProfile.full_name,
          email: userProfile.email,
          cpf_cnpj: userProfile.cpf,
        })

      if (customerSaveError) {
        console.error("Error saving customer:", customerSaveError);
        throw customerSaveError;
      }

      asaasCustomerId = customerData.id
    }

    // 3. Criar pagamento no Asaas
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1) // Vencimento em 1 dia

    console.log("Creating Asaas payment");
    const paymentResponse = await fetch(`${ASAAS_SANDBOX_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': Deno.env.get('ASAAS_API_KEY') ?? '',
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: 'PIX',
        value: plan.monthly_cost,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Assinatura do plano ${plan.name}`,
      }),
    })

    const paymentData = await paymentResponse.json()
    console.log("Asaas payment response:", paymentData);

    if (!paymentData.id) {
      console.error("Failed to create Asaas payment:", paymentData);
      throw new Error("Failed to create Asaas payment");
    }

    // 4. Gerar QR Code PIX
    console.log("Generating PIX QR Code");
    const qrCodeResponse = await fetch(`${ASAAS_SANDBOX_URL}/payments/${paymentData.id}/pixQrCode`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': Deno.env.get('ASAAS_API_KEY') ?? '',
      },
    })

    const qrCodeData = await qrCodeResponse.json()
    console.log("PIX QR Code generated:", qrCodeData);

    // 5. Salvar informações do pagamento
    const { data: payment, error: paymentError } = await supabaseClient
      .from('asaas_payments')
      .insert({
        subscription_id: subscriptionId,
        customer_id: userId,
        asaas_id: paymentData.id,
        amount: plan.monthly_cost,
        due_date: dueDate.toISOString(),
        status: 'PENDING',
        billing_type: 'PIX',
        payment_method: 'pix',
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Error saving payment:", paymentError);
      throw paymentError;
    }

    console.log("Payment saved successfully:", payment);

    return new Response(
      JSON.stringify({
        success: true,
        paymentData: {
          pixQrCode: qrCodeData.encodedImage,
          pixCode: qrCodeData.payload,
          value: plan.monthly_cost,
          dueDate: dueDate.toISOString(),
          subscriptionId,
          paymentId: payment.id,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
