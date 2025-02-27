
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';

serve(async (req) => {
  // Log da requisição recebida
  console.log("Nova requisição recebida:", new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log das variáveis de ambiente (sem expor as chaves)
    console.log("Ambiente Supabase configurado:", {
      url: !!Deno.env.get('SUPABASE_URL'),
      serviceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      asaasKey: !!Deno.env.get('ASAAS_API_KEY')
    });

    const { action, subscriptionId, userId, planId, paymentMethod } = await req.json()
    console.log("Dados recebidos:", { action, subscriptionId, userId, planId, paymentMethod });

    if (action !== "createPayment") {
      throw new Error("Invalid action")
    }

    // 1. Obter dados do plano
    console.log("Buscando dados do plano:", planId);
    const { data: plan, error: planError } = await supabaseClient
      .from('benefit_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error("Erro ao buscar plano:", planError);
      throw new Error("Plan not found");
    }

    console.log("Dados do plano encontrados:", plan);

    // 2. Obter ou criar cliente no Asaas
    console.log("Buscando perfil do usuário:", userId);
    const { data: userProfile, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error("Erro ao buscar perfil do usuário:", userError);
      throw new Error("User profile not found");
    }

    console.log("Perfil do usuário encontrado:", {
      name: userProfile.full_name,
      email: userProfile.email,
      cpf: userProfile.cpf
    });

    let asaasCustomerId

    // Verificar se já existe um customer_id
    const { data: existingCustomer } = await supabaseClient
      .from('asaas_customers')
      .select('asaas_id')
      .eq('user_id', userId)
      .single()

    if (existingCustomer) {
      asaasCustomerId = existingCustomer.asaas_id
      console.log("Cliente Asaas existente encontrado:", asaasCustomerId);
    } else {
      console.log("Criando novo cliente no Asaas");
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
      console.log("Resposta da criação do cliente Asaas:", customerData);

      if (!customerData.id) {
        console.error("Falha ao criar cliente no Asaas:", customerData);
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
        console.error("Erro ao salvar cliente:", customerSaveError);
        throw customerSaveError;
      }

      asaasCustomerId = customerData.id
      console.log("Novo cliente Asaas criado e salvo:", asaasCustomerId);
    }

    // 3. Criar pagamento no Asaas
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1) // Vencimento em 1 dia

    console.log("Criando pagamento no Asaas:", {
      customer: asaasCustomerId,
      billingType: paymentMethod.toUpperCase(),
      value: plan.monthly_cost,
      dueDate: dueDate.toISOString().split('T')[0]
    });

    const paymentResponse = await fetch(`${ASAAS_SANDBOX_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': Deno.env.get('ASAAS_API_KEY') ?? '',
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: paymentMethod.toUpperCase(),
        value: plan.monthly_cost,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Assinatura do plano ${plan.name}`,
      }),
    })

    const paymentData = await paymentResponse.json()
    console.log("Resposta da criação do pagamento Asaas:", paymentData);

    if (!paymentData.id) {
      console.error("Falha ao criar pagamento no Asaas:", paymentData);
      throw new Error("Failed to create Asaas payment");
    }

    // 4. Gerar QR Code PIX (se for pagamento PIX)
    let qrCodeData = null;
    if (paymentMethod.toUpperCase() === 'PIX') {
      console.log("Gerando QR Code PIX para pagamento:", paymentData.id);
      const qrCodeResponse = await fetch(`${ASAAS_SANDBOX_URL}/payments/${paymentData.id}/pixQrCode`, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': Deno.env.get('ASAAS_API_KEY') ?? '',
        },
      })

      qrCodeData = await qrCodeResponse.json()
      console.log("QR Code PIX gerado:", {
        success: !!qrCodeData.encodedImage,
        payload: !!qrCodeData.payload
      });
    }

    // 5. Salvar informações do pagamento
    console.log("Salvando informações do pagamento no banco de dados");
    const { data: payment, error: paymentError } = await supabaseClient
      .from('asaas_payments')
      .insert({
        subscription_id: subscriptionId,
        customer_id: userId,
        asaas_id: paymentData.id,
        amount: plan.monthly_cost,
        due_date: dueDate.toISOString(),
        status: 'PENDING',
        billing_type: paymentMethod.toUpperCase(),
        payment_method: paymentMethod.toLowerCase(),
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Erro ao salvar pagamento:", paymentError);
      throw paymentError;
    }

    console.log("Pagamento salvo com sucesso:", payment);

    return new Response(
      JSON.stringify({
        success: true,
        paymentData: {
          pixQrCode: qrCodeData?.encodedImage,
          pixCode: qrCodeData?.payload,
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
    console.error("Erro ao processar requisição:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
