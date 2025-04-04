
export async function handleCreateSubscription(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating subscription with data:`, data);
  
  // Validate required fields
  if (!data.customer || !data.value) {
    throw new Error('Subscription data incomplete. Customer and value are required.');
  }

  // Prepare subscription request
  const subscriptionData = {
    ...data,
    callbackUrl: data.callbackUrl || process.env.WEBHOOK_URL,
    successUrl: data.successUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/success",
    failureUrl: data.failureUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/failure",
    // Ensure billing type is set to UNDEFINED to allow customer to choose
    billingType: data.billingType || "UNDEFINED",
    // Set default cycle if not provided
    cycle: data.cycle || "MONTHLY",
    // Set next due date if not provided (default to 7 days from now)
    nextDueDate: data.nextDueDate || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
  };

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
  if (subscriptionResult.id) {
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
      subscriptionResult.invoiceUrl = paymentsData.data[0].invoiceUrl;
    }
  }

  return {
    success: true,
    ...subscriptionResult
  };
}
