
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';

serve(async (req) => {
  // Para depuração
  console.log("Nova requisição recebida:", new Date().toISOString());
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log das variáveis de ambiente (sem expor as chaves)
    console.log("Ambiente configurado:", {
      url: !!Deno.env.get('SUPABASE_URL'),
      serviceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      asaasKey: !!Deno.env.get('ASAAS_API_KEY')
    });

    const requestData = await req.json();
    const { action, subscriptionId, userId, planId, paymentMethod } = requestData;
    
    console.log("Dados recebidos:", { action, subscriptionId, userId, planId, paymentMethod });

    if (action !== "createPayment") {
      throw new Error("Ação inválida");
    }

    if (!planId) {
      throw new Error("ID do plano não fornecido");
    }

    if (!userId) {
      throw new Error("ID do usuário não fornecido");
    }

    if (!subscriptionId) {
      throw new Error("ID da assinatura não fornecido");
    }

    // 1. Obter dados do plano
    console.log("Buscando dados do plano:", planId);
    const { data: plan, error: planError } = await supabaseClient
      .from('benefit_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error("Erro ao buscar plano:", planError);
      throw new Error("Plano não encontrado");
    }

    console.log("Dados do plano encontrados:", plan);

    // 2. Obter ou criar cliente no Asaas
    console.log("Buscando perfil do usuário:", userId);
    const { data: userProfile, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error("Erro ao buscar perfil do usuário:", userError);
      throw new Error("Perfil do usuário não encontrado");
    }

    console.log("Perfil do usuário encontrado:", {
      name: userProfile.full_name,
      email: userProfile.email,
      cpf: userProfile.cpf
    });

    let asaasCustomerId;

    // Verificar se já existe um customer_id
    const { data: existingCustomer } = await supabaseClient
      .from('asaas_customers')
      .select('asaas_id')
      .eq('user_id', userId)
      .single();

    if (existingCustomer) {
      asaasCustomerId = existingCustomer.asaas_id;
      console.log("Cliente Asaas existente encontrado:", asaasCustomerId);
    } else {
      console.log("Criando novo cliente no Asaas");
      
      if (!userProfile.full_name || !userProfile.email || !userProfile.cpf) {
        throw new Error("Dados do usuário incompletos para criar cliente no Asaas");
      }
      
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
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.text();
        console.error("Resposta de erro do Asaas ao criar cliente:", errorData);
        throw new Error(`Erro ao criar cliente no Asaas: ${customerResponse.status} ${customerResponse.statusText}`);
      }

      const customerData = await customerResponse.json();
      console.log("Resposta da criação do cliente Asaas:", customerData);

      if (!customerData.id) {
        console.error("Falha ao criar cliente no Asaas:", customerData);
        throw new Error("Falha ao criar cliente no Asaas");
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
        });

      if (customerSaveError) {
        console.error("Erro ao salvar cliente:", customerSaveError);
        throw customerSaveError;
      }

      asaasCustomerId = customerData.id;
      console.log("Novo cliente Asaas criado e salvo:", asaasCustomerId);
    }

    // 3. Criar pagamento no Asaas
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Vencimento em 1 dia

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
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text();
      console.error("Resposta de erro do Asaas ao criar pagamento:", errorData);
      throw new Error(`Erro ao criar pagamento no Asaas: ${paymentResponse.status} ${paymentResponse.statusText}`);
    }

    const paymentData = await paymentResponse.json();
    console.log("Resposta da criação do pagamento Asaas:", paymentData);

    if (!paymentData.id) {
      console.error("Falha ao criar pagamento no Asaas:", paymentData);
      throw new Error("Falha ao criar pagamento no Asaas");
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
      });

      if (!qrCodeResponse.ok) {
        const errorData = await qrCodeResponse.text();
        console.error("Resposta de erro do Asaas ao gerar QR code:", errorData);
        throw new Error(`Erro ao gerar QR Code PIX: ${qrCodeResponse.status} ${qrCodeResponse.statusText}`);
      }

      qrCodeData = await qrCodeResponse.json();
      console.log("QR Code PIX gerado - propriedades:", Object.keys(qrCodeData));
      
      if (!qrCodeData.encodedImage || !qrCodeData.payload) {
        console.error("Dados do QR Code PIX incompletos:", qrCodeData);
        throw new Error("QR Code PIX não gerado corretamente");
      }
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
      .single();

    if (paymentError) {
      console.error("Erro ao salvar pagamento:", paymentError);
      throw paymentError;
    }

    console.log("Pagamento salvo com sucesso:", payment);

    // 6. Montar e retornar resposta
    const responseData = {
      success: true,
      paymentData: {
        pixQrCode: qrCodeData?.encodedImage,
        pixCode: qrCodeData?.payload,
        value: plan.monthly_cost,
        dueDate: dueDate.toISOString(),
        subscriptionId,
        paymentId: payment.id,
      },
    };

    console.log("Resposta sendo enviada:", {
      success: responseData.success,
      hasPixQrCode: !!responseData.paymentData.pixQrCode,
      hasPixCode: !!responseData.paymentData.pixCode,
    });

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
