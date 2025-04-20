/**
 * Implementação direta de checkout para cartão de crédito sem criar cliente
 * Esta solução evita completamente o problema de CPF/CNPJ
 */

export async function createDirectCheckout(data: any, apiKey: string, baseUrl: string) {
  try {
    console.log("Criando checkout direto sem cliente associado");
    
    // Validar dados necessários
    if (!data.value || !data.description) {
      throw new Error("Valor e descrição são obrigatórios");
    }
    
    // Cancelar assinaturas pendentes anteriores se houver dados do cliente
    if (data.customerData && data.customerData.id) {
      try {
        const { data: pendingSubscriptions, error } = await data.supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', data.customerData.id)
          .eq('status', 'pending')
          .select();
          
        if (pendingSubscriptions && pendingSubscriptions.length > 0) {
          console.log(`Canceladas ${pendingSubscriptions.length} assinaturas pendentes anteriores`);
        }
      } catch (err) {
        console.error("Erro ao cancelar assinaturas pendentes:", err);
      }
    }
    
    // Preparar dados para o checkout do Asaas
    // Seguindo o fluxo de pagamento conforme a memória:
    // 1. Direcionar o usuário para o pagamento no Asaas
    // 2. Após o pagamento ser validado, o status da assinatura será alterado via webhook
    // 3. Com o status atualizado, as funcionalidades serão liberadas
    const checkoutData = {
      value: data.value,
      description: data.description,
      externalReference: data.externalReference,
      paymentMethodCodes: ["CREDIT_CARD"],
      chargeTypes: ["DETACHED"], // Para pagamento único
      minutesToExpire: 60,
      callback: data.callback || {
        successUrl: "https://app.treinepass.com.br/payment/success",
        failureUrl: "https://app.treinepass.com.br/payment/failure"
      }
    };
    
    console.log("Dados do checkout:", checkoutData);
    
    // Fazer requisição direta à API do Asaas para criar sessão de checkout
    console.log(`Fazendo requisição para ${baseUrl}/checkout/sessions`);
    
    const response = await fetch(`${baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(checkoutData)
    });
    
    const responseText = await response.text();
    console.log(`Resposta bruta da API: ${responseText}`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Erro ao fazer parse da resposta JSON:', e);
      throw new Error(`Resposta inválida da API: ${responseText}`);
    }
    
    console.log("Resposta da API do Asaas:", responseData);
    
    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Erro desconhecido');
    }
    
    if (!responseData.checkoutUrl) {
      console.error('Resposta sem URL de checkout:', responseData);
      throw new Error('URL de checkout não recebida do Asaas');
    }
    
    // Criando o objeto de resultado com tipagem completa
    const result: {
      success: boolean;
      id: string;
      checkoutUrl: string;
      value: number;
      planName: string;
      planPrice: number;
      externalReference: string;
      subscriptionId?: string; // Tornando opcional para evitar erros de tipo
    } = {
      success: true,
      id: responseData.id,
      checkoutUrl: responseData.checkoutUrl,
      value: data.value,
      planName: data.planName,
      planPrice: data.value,
      externalReference: data.externalReference
    };
    
    // Criar registro de assinatura no banco de dados se temos dados do cliente e supabase
    if (data.customerData && data.customerData.id && data.planId && data.supabase) {
      try {
        // Gravar o ID da sessão de checkout E o external_reference no registro da assinatura
        // Isso garante que possamos encontrar a assinatura depois, tanto pelo ID da sessão
        // quanto pelo external_reference que será enviado nos webhooks
        const { data: subscription, error } = await data.supabase
          .from('subscriptions')
          .insert([{
            user_id: data.customerData.id,
            plan_id: data.planId,
            payment_id: responseData.id,
            external_reference: data.externalReference,
            status: 'pending',
            payment_method: 'CREDIT_CARD',
            amount: data.value,
            checkout_session_id: responseData.id, // Guardar explicitamente o ID da sessão
            due_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
          }])
          .select()
          .single();
          
        if (error) {
          console.error("Erro ao criar assinatura:", error);
        } else {
          console.log("Assinatura criada com sucesso:", subscription);
          result.subscriptionId = subscription.id;
        }
      } catch (dbError) {
        console.error("Erro ao salvar assinatura no banco:", dbError);
      }
    } else {
      console.log("Dados insuficientes para criar assinatura no banco");
    }
    
    console.log('Resultado final:', result);
    return result;
    
  } catch (error) {
    console.error("Erro ao criar checkout direto:", error);
    throw new Error(`Erro ao criar checkout direto: ${error.message}`);
  }
}
