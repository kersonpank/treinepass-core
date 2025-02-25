
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from asaas-api!");

interface RequestBody {
  userId: string;
  planId: string;
  paymentMethod: string;
  proratedAmount?: number;
  upgradeFromSubscriptionId?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { userId, planId, paymentMethod, proratedAmount, upgradeFromSubscriptionId } = await req.json() as RequestBody;

    console.log("Processing subscription request:", {
      userId,
      planId,
      paymentMethod,
      proratedAmount,
      upgradeFromSubscriptionId
    });

    // Fetch user profile
    const { data: userProfile, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error("Error fetching user profile:", userError);
      throw new Error('User profile not found');
    }

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('benefit_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error("Error fetching plan:", planError);
      throw new Error('Plan not found');
    }

    // Get ASAAS configuration
    const { data: asaasConfig } = await supabaseClient.rpc('get_asaas_config');
    if (!asaasConfig) {
      throw new Error('ASAAS configuration not found');
    }

    const apiKey = asaasConfig.api_key;
    const apiUrl = asaasConfig.api_url;

    // Create or get ASAAS customer
    let asaasCustomer;
    const { data: existingCustomer } = await supabaseClient
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingCustomer) {
      asaasCustomer = existingCustomer;
    } else {
      // Create customer in ASAAS
      const customerResponse = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          name: userProfile.full_name,
          email: userProfile.email,
          cpfCnpj: userProfile.cpf,
          phone: userProfile.phone_number
        })
      });

      if (!customerResponse.ok) {
        console.error("Error creating ASAAS customer:", await customerResponse.text());
        throw new Error('Failed to create customer in ASAAS');
      }

      const customerData = await customerResponse.json();

      // Save customer in database
      const { data: newCustomer, error: customerError } = await supabaseClient
        .from('asaas_customers')
        .insert({
          user_id: userId,
          asaas_id: customerData.id,
          name: userProfile.full_name,
          email: userProfile.email,
          cpf_cnpj: userProfile.cpf
        })
        .select()
        .single();

      if (customerError) {
        console.error("Error saving customer:", customerError);
        throw new Error('Failed to save customer');
      }

      asaasCustomer = newCustomer;
    }

    // Calculate billing details
    const amount = proratedAmount || plan.monthly_cost;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow

    // Create payment in ASAAS
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
        value: amount,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Assinatura do plano ${plan.name}${proratedAmount ? ' (valor proporcional)' : ''}`,
      })
    });

    if (!paymentResponse.ok) {
      console.error("Error creating ASAAS payment:", await paymentResponse.text());
      throw new Error('Failed to create payment');
    }

    const paymentData = await paymentResponse.json();

    // Save payment in database
    const { data: newPayment, error: paymentError } = await supabaseClient
      .from('asaas_payments')
      .insert({
        customer_id: asaasCustomer.id,
        asaas_id: paymentData.id,
        amount: amount,
        status: 'PENDING',
        billing_type: paymentMethod,
        payment_link: paymentData.bankSlipUrl || paymentData.invoiceUrl,
        due_date: dueDate.toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error saving payment:", paymentError);
      throw new Error('Failed to save payment');
    }

    // If this is an upgrade, update the old subscription
    if (upgradeFromSubscriptionId) {
      await supabaseClient
        .from('user_plan_subscriptions')
        .update({ status: 'cancelled', end_date: new Date().toISOString() })
        .eq('id', upgradeFromSubscriptionId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: newPayment.id,
          paymentLink: paymentData.bankSlipUrl || paymentData.invoiceUrl || paymentData.pixQrCodeUrl
        }
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
