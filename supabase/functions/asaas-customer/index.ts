
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

console.log("Hello from asaas-customer!");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { subscriptionId, planId, paymentMethod } = await req.json();

    console.log("Processing subscription payment:", { subscriptionId, planId, paymentMethod });

    // 1. Get subscription details with user and plan info
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('user_plan_subscriptions')
      .select(`
        *,
        user_profiles:user_id (
          full_name,
          email,
          cpf,
          phone_number
        ),
        benefit_plans:plan_id (
          name,
          monthly_cost,
          description
        )
      `)
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      console.error("Error fetching subscription:", subscriptionError);
      throw new Error('Subscription not found');
    }

    // 2. Get ASAAS configuration
    const { data: asaasConfig } = await supabaseClient.rpc('get_asaas_config');
    if (!asaasConfig) {
      throw new Error('ASAAS configuration not found');
    }

    const apiKey = asaasConfig.api_key;
    const apiUrl = asaasConfig.api_url;

    // 3. Create or get ASAAS customer
    let asaasCustomer;
    const { data: existingCustomer } = await supabaseClient
      .from('asaas_customers')
      .select('*')
      .eq('user_id', subscription.user_id)
      .maybeSingle();

    if (existingCustomer) {
      asaasCustomer = existingCustomer;
    } else {
      // Create customer in ASAAS
      console.log("Creating new ASAAS customer...");
      const customerResponse = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          name: subscription.user_profiles.full_name,
          email: subscription.user_profiles.email,
          cpfCnpj: subscription.user_profiles.cpf,
          phone: subscription.user_profiles.phone_number
        })
      });

      if (!customerResponse.ok) {
        const responseText = await customerResponse.text();
        console.error("Error creating ASAAS customer:", responseText);
        throw new Error('Falha ao criar cliente no ASAAS');
      }

      const customerData = await customerResponse.json();
      console.log("ASAAS customer created:", customerData);

      // Save customer in database
      const { data: newCustomer, error: customerError } = await supabaseClient
        .from('asaas_customers')
        .insert({
          user_id: subscription.user_id,
          asaas_id: customerData.id,
          name: subscription.user_profiles.full_name,
          email: subscription.user_profiles.email,
          cpf_cnpj: subscription.user_profiles.cpf
        })
        .select()
        .single();

      if (customerError) {
        console.error("Error saving customer:", customerError);
        throw new Error('Falha ao salvar cliente');
      }

      asaasCustomer = newCustomer;
    }

    // 4. Create payment in ASAAS
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow

    console.log("Creating ASAAS payment...");
    const paymentResponse = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify({
        customer: asaasCustomer.asaas_id,
        billingType: paymentMethod === 'credit_card' ? 'CREDIT_CARD' : 
                     paymentMethod === 'pix' ? 'PIX' : 'BOLETO',
        value: subscription.benefit_plans.monthly_cost,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Assinatura do plano ${subscription.benefit_plans.name}`,
      })
    });

    if (!paymentResponse.ok) {
      const responseText = await paymentResponse.text();
      console.error("Error creating ASAAS payment:", responseText);
      throw new Error('Falha ao criar pagamento');
    }

    const paymentData = await paymentResponse.json();
    console.log("ASAAS payment created:", paymentData);

    // 5. Save payment in database
    const { error: paymentError } = await supabaseClient
      .from('asaas_payments')
      .insert({
        customer_id: asaasCustomer.id,
        subscription_id: subscriptionId,
        asaas_id: paymentData.id,
        amount: subscription.benefit_plans.monthly_cost,
        status: 'PENDING',
        billing_type: paymentMethod,
        payment_link: paymentData.bankSlipUrl || paymentData.invoiceUrl || paymentData.pixQrCodeUrl,
        due_date: dueDate.toISOString()
      });

    if (paymentError) {
      console.error("Error saving payment:", paymentError);
      throw new Error('Falha ao salvar pagamento');
    }

    console.log("Payment process completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink: paymentData.bankSlipUrl || paymentData.invoiceUrl || paymentData.pixQrCodeUrl
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(
      JSON.stringify({
        error: err.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      },
    );
  }
});
