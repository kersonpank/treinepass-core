
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
  const subscriptionData = {
    customer: data.customer,
    billingType: data.billingType || "UNDEFINED", // Allow customer to choose
    value: data.value,
    nextDueDate: nextDueDate,
    description: data.description || `Assinatura ${data.planName || 'TreinePass'}`,
    cycle: data.cycle || "MONTHLY",
    externalReference: data.externalReference,
    callbackUrl: data.callbackUrl || process.env.WEBHOOK_URL,
    successUrl: data.successUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/success",
    failureUrl: data.failureUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/failure",
  };

  console.log("Sending subscription data to Asaas:", subscriptionData);

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
