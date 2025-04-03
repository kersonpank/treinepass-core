
export async function handleCreateSubscription(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating subscription with data:`, data);
  
  // Validate required fields
  if (!data.customer || !data.value) {
    throw new Error('Subscription data incomplete. Customer and value are required.');
  }

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify(data)
  });

  // Parse response
  const subscriptionData = await asaasResponse.json();
  console.log(`Asaas subscription response:`, subscriptionData);

  if (!asaasResponse.ok) {
    throw new Error(`Asaas API error: ${subscriptionData.errors?.[0]?.description || 'Unknown error'}`);
  }

  // Get the invoice URL from the first payment
  if (subscriptionData.id) {
    const paymentsResponse = await fetch(`${baseUrl}/subscriptions/${subscriptionData.id}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });

    const paymentsData = await paymentsResponse.json();
    console.log(`Asaas subscription payments:`, paymentsData);

    if (paymentsResponse.ok && paymentsData.data && paymentsData.data.length > 0) {
      subscriptionData.invoiceUrl = paymentsData.data[0].invoiceUrl;
    }
  }

  return {
    success: true,
    ...subscriptionData
  };
}
