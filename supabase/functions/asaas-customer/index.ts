
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

console.log("Hello from asaas-customer!");

type AsaasPaymentType = 'BOLETO' | 'CREDIT_CARD' | 'PIX';
type PaymentMethod = 'boleto' | 'credit_card' | 'pix';

const getAsaasPaymentType = (method: PaymentMethod): AsaasPaymentType => {
  switch (method) {
    case 'credit_card':
      return 'CREDIT_CARD';
    case 'pix':
      return 'PIX';
    default:
      return 'BOLETO';
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { subscriptionId, planId, paymentMethod } = await req.json();
    console.log("Processing payment request:", { subscriptionId, planId, paymentMethod });

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
      throw new Error('Assinatura não encontrada');
    }

    // 2. Get ASAAS configuration
    const { data: asaasConfig } = await supabaseClient.rpc('get_asaas_config');
    if (!asaasConfig) {
      throw new Error('Configuração do ASAAS não encontrada');
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
          phone: subscription.user_profiles.phone_number,
          notificationDisabled: false
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
    
    const paymentData = {
      customer: asaasCustomer.asaas_id,
      billingType: getAsaasPaymentType(paymentMethod as PaymentMethod),
      value: subscription.benefit_plans.monthly_cost,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Assinatura do plano ${subscription.benefit_plans.name}`,
      externalReference: subscriptionId,
      postalService: false
    };

    console.log("Payment data:", paymentData);

    const paymentResponse = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      const responseText = await paymentResponse.text();
      console.error("Error creating ASAAS payment:", responseText);
      throw new Error('Falha ao criar pagamento');
    }

    const paymentResponseData = await paymentResponse.json();
    console.log("ASAAS payment created:", paymentResponseData);

    // Get the appropriate payment link based on the payment method
    let paymentLink = '';
    if (paymentMethod === 'pix') {
      // For PIX, we need to make another request to get the PIX info
      const pixResponse = await fetch(`${apiUrl}/payments/${paymentResponseData.id}/pixQrCode`, {
        headers: {
          'access_token': apiKey
        }
      });
      
      if (!pixResponse.ok) {
        console.error("Error getting PIX info:", await pixResponse.text());
        throw new Error('Falha ao gerar QR Code PIX');
      }
      
      const pixData = await pixResponse.json();
      paymentLink = pixData.payload || pixData.encodedImage;
    } else if (paymentMethod === 'credit_card') {
      paymentLink = paymentResponseData.invoiceUrl;
    } else {
      // For boleto
      paymentLink = paymentResponseData.bankSlipUrl;
    }

    // 5. Save payment in database
    const { error: paymentError } = await supabaseClient
      .from('asaas_payments')
      .insert({
        customer_id: asaasCustomer.id,
        subscription_id: subscriptionId,
        asaas_id: paymentResponseData.id,
        amount: subscription.benefit_plans.monthly_cost,
        status: paymentResponseData.status,
        billing_type: paymentMethod,
        payment_link: paymentLink,
        due_date: dueDate.toISOString()
      });

    if (paymentError) {
      console.error("Error saving payment:", paymentError);
      throw new Error('Falha ao salvar pagamento');
    }

    // 6. Update subscription with Asaas customer ID
    const { error: updateError } = await supabaseClient
      .from('user_plan_subscriptions')
      .update({
        asaas_customer_id: asaasCustomer.asaas_id,
        asaas_payment_link: paymentLink
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw new Error('Falha ao atualizar assinatura');
    }

    console.log("Payment process completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink
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
