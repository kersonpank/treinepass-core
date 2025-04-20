
/**
 * Handler para criar assinatura no Asaas
 */

export async function handleCreateSubscription(data: any, apiKey: string, baseUrl: string) {
  console.log("Creating subscription with data:", data);
  
  try {
    // Validar dados obrigatórios
    if (!data.customer || !data.value || !data.cycle) {
      throw new Error("Customer, value and cycle are required");
    }
    
    // Formatar dados de CEP se incluídos
    if (data.customerData && data.customerData.postalCode) {
      data.customerData.postalCode = data.customerData.postalCode.replace(/[^\d]/g, '');
      if (data.customerData.postalCode.length !== 8) {
        data.customerData.postalCode = "01310930"; // CEP válido padrão
      }
    }
    
    // Fazer requisição ao Asaas
    const response = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify(data)
    });

    // Obter resposta
    const subscriptionResult = await response.json();
    
    if (!response.ok) {
      console.error("Asaas API error:", subscriptionResult);
      throw new Error(subscriptionResult.errors?.[0]?.description || 'Unknown error');
    }
    
    console.log("Subscription created successfully:", subscriptionResult);
    
    // A resposta da API do Asaas não inclui a URL da fatura, 
    // então precisamos buscar a primeira fatura da assinatura
    let invoiceUrl = null;
    
    try {
      // Aguardar um momento para a fatura ser gerada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar faturas da assinatura
      const invoicesResponse = await fetch(`${baseUrl}/subscriptions/${subscriptionResult.id}/payments`, {
        headers: {
          'access_token': apiKey,
          'User-Agent': 'TreinePass-App'
        }
      });
      
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        
        if (invoicesData.data && invoicesData.data.length > 0) {
          // Pegar a fatura mais recente
          const latestInvoice = invoicesData.data[0];
          invoiceUrl = latestInvoice.invoiceUrl;
          
          console.log("Found subscription invoice:", latestInvoice);
        }
      }
    } catch (invoiceError) {
      console.error("Error fetching subscription invoices:", invoiceError);
      // Não interromper o fluxo se não conseguir buscar a fatura
    }
    
    return {
      success: true,
      subscriptionId: subscriptionResult.id,
      status: subscriptionResult.status,
      value: subscriptionResult.value,
      nextDueDate: subscriptionResult.nextDueDate,
      cycle: subscriptionResult.cycle,
      description: subscriptionResult.description,
      invoiceUrl: invoiceUrl,
      paymentLink: invoiceUrl // Compatibilidade com o fluxo atual
    };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}
