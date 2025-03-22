<<<<<<< HEAD

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
=======
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
>>>>>>> main

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
<<<<<<< HEAD
}

interface CreateCustomerPayload {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { method } = req.url.split('?')[0].split('/').pop() ?? ''
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Obter token de autenticação
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verificar usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Configuração ASAAS
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    const ASAAS_API_URL = 'https://www.asaas.com/api/v3'

    switch (method) {
      case 'create': {
        const payload: CreateCustomerPayload = await req.json()
        
        console.log('Creating ASAAS customer:', payload)

        // Criar cliente no ASAAS
        const asaasResponse = await fetch(`${ASAAS_API_URL}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY!
          },
          body: JSON.stringify(payload)
        })

        if (!asaasResponse.ok) {
          const error = await asaasResponse.json()
          console.error('ASAAS API error:', error)
          throw new Error(`ASAAS API error: ${error.errors?.[0]?.description || 'Unknown error'}`)
        }

        const asaasCustomer = await asaasResponse.json()
        console.log('ASAAS customer created:', asaasCustomer)

        // Salvar cliente no banco
        const { error: dbError } = await supabase
          .from('asaas_customers')
          .insert({
            user_id: user.id,
            asaas_id: asaasCustomer.id,
            name: asaasCustomer.name,
            email: asaasCustomer.email,
            cpf_cnpj: asaasCustomer.cpfCnpj,
          })

        if (dbError) {
          console.error('Database error:', dbError)
          throw new Error('Failed to save customer data')
        }

        return new Response(
          JSON.stringify({ success: true, customer: asaasCustomer }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get': {
        // Buscar cliente existente
        const { data: customer, error: customerError } = await supabase
          .from('asaas_customers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (customerError && customerError.code !== 'PGRST116') {
          console.error('Database error:', customerError)
          throw new Error('Failed to fetch customer data')
        }

        return new Response(
          JSON.stringify({ success: true, customer }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Method not allowed')
    }
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
=======
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

console.log("Hello from asaas-customer!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    const { action } = requestData;

    // Get ASAAS configuration
    const { data: asaasConfig } = await supabaseClient.rpc('get_asaas_config');
    if (!asaasConfig) {
      throw new Error('Configuração do ASAAS não encontrada');
    }

    const apiKey = asaasConfig.api_key;
    const apiUrl = asaasConfig.api_url;

    if (action === 'createCustomer') {
      const { userId, name, email, cpf, phone } = requestData;
      console.log("Creating customer:", { userId, name, email, cpf, phone });

      // Create customer in ASAAS
      const customerResponse = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          name,
          email,
          cpfCnpj: cpf,
          phone,
          notificationDisabled: false
        })
      });

      if (!customerResponse.ok) {
        console.error("Error creating ASAAS customer:", await customerResponse.text());
        throw new Error('Falha ao criar cliente no ASAAS');
      }

      const customerData = await customerResponse.json();
      console.log("ASAAS customer created:", customerData);

      // Save customer in database
      const { data: newCustomer, error: customerError } = await supabaseClient
        .from('asaas_customers')
        .insert({
          user_id: userId,
          asaas_id: customerData.id,
          name,
          email,
          cpf_cnpj: cpf
        })
        .select()
        .single();

      if (customerError) {
        console.error("Error saving customer:", customerError);
        throw new Error('Falha ao salvar cliente');
      }

      return new Response(
        JSON.stringify({
          success: true,
          customerId: customerData.id
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      );
    } else if (action === 'createPayment') {
      const { subscriptionId, planId, paymentMethod } = requestData;
      console.log("Processing payment request:", { subscriptionId, planId, paymentMethod });

      // 1. Get subscription details
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

      // 2. Get or create ASAAS customer
      let asaasCustomer;
      const { data: existingCustomer } = await supabaseClient
        .from('asaas_customers')
        .select('*')
        .eq('user_id', subscription.user_id)
        .maybeSingle();

      if (existingCustomer) {
        asaasCustomer = existingCustomer;
      } else {
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
          console.error("Error creating ASAAS customer:", await customerResponse.text());
          throw new Error('Falha ao criar cliente no ASAAS');
        }

        const customerData = await customerResponse.json();
        console.log("ASAAS customer created:", customerData);

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

      // 3. Create payment
      console.log("Creating ASAAS payment...");
      const paymentLink = await fetch(`${apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          customer: asaasCustomer.asaas_id,
          billingType: paymentMethod.toUpperCase(),
          value: subscription.benefit_plans.monthly_cost,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `Assinatura do plano ${subscription.benefit_plans.name}`,
          externalReference: subscriptionId
        })
      });

      if (!paymentLink.ok) {
        console.error("Error creating payment:", await paymentLink.text());
        throw new Error('Falha ao criar pagamento');
      }

      const payment = await paymentLink.json();
      console.log("Payment created:", payment);

      // 4. Create payment link/checkout URL
      const checkoutResponse = await fetch(`${apiUrl}/payments/${payment.id}/identificationField`, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        }
      });

      if (!checkoutResponse.ok) {
        console.error("Error getting checkout info:", await checkoutResponse.text());
        throw new Error('Falha ao gerar link de pagamento');
      }

      const checkoutData = await checkoutResponse.json();
      console.log("Checkout data:", checkoutData);

      // 5. Save payment info
      const { error: paymentError } = await supabaseClient
        .from('asaas_payments')
        .insert({
          customer_id: asaasCustomer.id,
          subscription_id: subscriptionId,
          asaas_id: payment.id,
          amount: subscription.benefit_plans.monthly_cost,
          status: payment.status,
          billing_type: paymentMethod,
          payment_link: checkoutData.identificationField,
          due_date: payment.dueDate
        });

      if (paymentError) {
        console.error("Error saving payment:", paymentError);
        throw new Error('Falha ao salvar pagamento');
      }

      // 6. Update subscription
      const { error: updateError } = await supabaseClient
        .from('user_plan_subscriptions')
        .update({
          asaas_customer_id: asaasCustomer.asaas_id,
          asaas_payment_link: checkoutData.identificationField
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
          paymentData: {
            status: payment.status,
            identificationField: checkoutData.identificationField,
            value: payment.value,
            dueDate: payment.dueDate,
            billingType: payment.billingType,
            invoiceUrl: payment.invoiceUrl,
            paymentId: payment.id
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
    } else {
      throw new Error('Ação inválida');
    }
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
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
>>>>>>> main
