/**
 * Handler para criar assinaturas no Asaas
 * Endpoint: /v3/subscriptions
 */

export async function handleCreateSubscription(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating subscription with data:`, data);
  
  // Validate required fields
  if (!data.customer || !data.value) {
    throw new Error('Subscription data incomplete. Customer and value are required.');
  }

  // Format next due date if provided as Date object
  let nextDueDate = data.nextDueDate;
  if (nextDueDate instanceof Date) {
    nextDueDate = nextDueDate.toISOString().split('T')[0];
  } else if (!nextDueDate) {
    // Default to 7 days from now if not provided
    nextDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];
  }

  // Prepare subscription request
  const subscriptionData: any = {
    customer: data.customer,
    billingTypes: data.billingTypes || ["BOLETO", "CREDIT_CARD", "PIX"],
    value: data.value,
    nextDueDate: nextDueDate,
    description: data.description || `Assinatura ${data.planName || 'TreinePass'}`,
    cycle: data.cycle || "MONTHLY",
    externalReference: data.externalReference
  };
  
  // Adicionar URLs de callback apenas se fornecidas
  if (data.callbackUrl) {
    subscriptionData.callbackUrl = data.callbackUrl;
  }
  
  if (data.successUrl) {
    subscriptionData.successUrl = data.successUrl;
  } else {
    subscriptionData.successUrl = "https://app.treinepass.com.br/payment/success";
  }
  
  if (data.failureUrl) {
    subscriptionData.failureUrl = data.failureUrl;
  } else {
    subscriptionData.failureUrl = "https://app.treinepass.com.br/payment/failure";
  }

  console.log("Sending subscription data to Asaas:", subscriptionData);

  try {
    // Make API request to Asaas
    const asaasResponse = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(subscriptionData)
    });

    // Parse response
    const subscriptionResult = await asaasResponse.json();
    console.log(`Asaas subscription response:`, subscriptionResult);

    if (!asaasResponse.ok) {
      throw new Error(`Asaas API error: ${subscriptionResult.errors?.[0]?.description || 'Unknown error'}`);
    }

    // Get the invoice URL from the first payment
    let invoiceUrl = null;
    
    if (subscriptionResult.id) {
      try {
        const paymentsResponse = await fetch(`${baseUrl}/subscriptions/${subscriptionResult.id}/payments`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          }
        });

        const paymentsData = await paymentsResponse.json();
        console.log(`Asaas subscription payments:`, paymentsData);

        if (paymentsResponse.ok && paymentsData.data && paymentsData.data.length > 0) {
          invoiceUrl = paymentsData.data[0].invoiceUrl;
        }
      } catch (paymentError) {
        console.error("Error fetching subscription payments:", paymentError);
        // Continuar mesmo se não conseguir obter os pagamentos
      }
    }

    return {
      success: true,
      ...subscriptionResult,
      invoiceUrl: invoiceUrl
    };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}
