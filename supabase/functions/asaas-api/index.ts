
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionBody {
  userId: string;
  planId: string;
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get request body
    const { userId, planId, paymentMethod } = await req.json() as CreateSubscriptionBody;

    // Get user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('benefit_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Check if customer already exists in Asaas
    const { data: existingCustomer } = await supabase
      .from('asaas_customers')
      .select('asaas_id')
      .eq('user_id', userId)
      .single();

    let asaasCustomerId = existingCustomer?.asaas_id;

    // If customer doesn't exist, create one
    if (!asaasCustomerId) {
      console.log('Creating new Asaas customer...');
      const customerResponse = await fetch('https://sandbox.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify({
          name: userProfile.full_name,
          email: userProfile.email,
          cpfCnpj: userProfile.cpf.replace(/\D/g, ''),
          phone: userProfile.phone_number
        })
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to create Asaas customer');
      }

      const customerData = await customerResponse.json();
      asaasCustomerId = customerData.id;

      // Save Asaas customer ID
      await supabase.from('asaas_customers').insert({
        user_id: userId,
        asaas_id: asaasCustomerId,
        name: userProfile.full_name,
        email: userProfile.email,
        cpf_cnpj: userProfile.cpf
      });
    }

    // Create subscription in Asaas
    console.log('Creating Asaas subscription...');
    const subscriptionResponse = await fetch('https://sandbox.asaas.com/api/v3/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: paymentMethod.toUpperCase(),
        value: plan.monthly_cost,
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plan.name}`,
        maxPayments: 0 // infinite
      })
    });

    if (!subscriptionResponse.ok) {
      throw new Error('Failed to create Asaas subscription');
    }

    const subscriptionData = await subscriptionResponse.json();

    // Update user_plan_subscriptions
    const { error: subscriptionError } = await supabase
      .from('user_plan_subscriptions')
      .update({
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: subscriptionData.id,
        payment_method: paymentMethod,
        status: 'pending',
        payment_status: 'pending',
        next_payment_date: subscriptionData.nextDueDate
      })
      .eq('user_id', userId)
      .eq('plan_id', planId);

    if (subscriptionError) {
      throw subscriptionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: subscriptionData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
