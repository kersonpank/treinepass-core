
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { userId, planId, paymentMethod } = await req.json();

    // Buscar dados do usuário e do plano
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    const { data: planData, error: planError } = await supabase
      .from('benefit_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !planData) {
      throw new Error('Plan not found');
    }

    // 1. Criar ou recuperar cliente no Asaas
    let asaasCustomerId;

    // Verificar se já existe um customer_id do Asaas
    const { data: existingCustomer } = await supabase
      .from('asaas_customers')
      .select('asaas_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingCustomer?.asaas_id) {
      asaasCustomerId = existingCustomer.asaas_id;
      console.log('Using existing Asaas customer:', asaasCustomerId);
    } else {
      // Criar novo cliente no Asaas
      const customerResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify({
          name: userData.full_name,
          email: userData.email,
          cpfCnpj: userData.cpf,
          phone: userData.phone_number
        })
      });

      const customerData = await customerResponse.json();
      
      if (!customerResponse.ok) {
        throw new Error(`Error creating Asaas customer: ${JSON.stringify(customerData)}`);
      }

      asaasCustomerId = customerData.id;

      // Salvar o ID do cliente do Asaas
      await supabase.from('asaas_customers').insert({
        user_id: userId,
        asaas_id: asaasCustomerId,
        name: userData.full_name,
        email: userData.email,
        cpf_cnpj: userData.cpf
      });

      console.log('Created new Asaas customer:', asaasCustomerId);
    }

    // 2. Criar assinatura no Asaas
    const subscriptionResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: paymentMethod.toUpperCase(),
        value: planData.monthly_cost,
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura - ${planData.name}`,
        maxPayments: 0, // 0 = indefinido
        updatePendingPayments: true
      })
    });

    const subscriptionData = await subscriptionResponse.json();
    
    if (!subscriptionResponse.ok) {
      throw new Error(`Error creating Asaas subscription: ${JSON.stringify(subscriptionData)}`);
    }

    console.log('Created Asaas subscription:', subscriptionData);

    // 3. Criar registro da assinatura no nosso banco
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_plan_subscriptions')
      .update({
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: subscriptionData.id,
        payment_method: paymentMethod,
        status: 'pending',
        payment_status: 'pending',
        total_value: planData.monthly_cost,
        asaas_payment_link: subscriptionData.paymentLink
      })
      .eq('id', planId)
      .select()
      .single();

    if (subscriptionError) {
      throw subscriptionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          paymentLink: subscriptionData.paymentLink
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
