
interface CheckoutSessionData {
  customerData?: {
    name: string;
    cpfCnpj: string;
    email: string;
    phone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    postalCode?: string;
    province?: string;
  };
  billingTypes: string[];
  chargeTypes: string[];
  value: number;
  description: string;
  externalReference: string;
  minutesToExpire?: number;
  callback?: {
    successUrl?: string;
    failureUrl?: string;
  };
}

export async function handleCreateCheckoutSession(data: CheckoutSessionData, apiKey: string, baseUrl: string) {
  console.log(`Creating checkout session with data:`, data);
  
  // Prepare the checkout session request
  const checkoutData = {
    billingTypes: data.billingTypes,
    chargeTypes: data.chargeTypes,
    minutesToExpire: data.minutesToExpire || 60,
    callback: data.callback,
    items: [{
      name: data.description,
      value: data.value,
      quantity: 1
    }],
    customerData: data.customerData,
    externalReference: data.externalReference
  };

  // Make API request to Asaas
  const response = await fetch(`${baseUrl}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify(checkoutData)
  });

  // Parse response
  const result = await response.json();
  console.log(`Asaas checkout response:`, result);

  if (!response.ok) {
    throw new Error(`Asaas API error: ${result.errors?.[0]?.description || 'Unknown error'}`);
  }

  return {
    success: true,
    ...result
  };
}
