
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
    city?: number | string;
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
    cancelUrl?: string;
  };
}

export async function handleCreateCheckoutSession(data: CheckoutSessionData, apiKey: string, baseUrl: string) {
  console.log(`Creating checkout session with data:`, data);
  
  try {
    // Prepare the checkout session request
    const checkoutData = {
      billingTypes: data.billingTypes,
      chargeTypes: data.chargeTypes,
      minutesToExpire: data.minutesToExpire || 60,
      callback: {
        successUrl: data.callback?.successUrl,
        failureUrl: data.callback?.failureUrl,
        cancelUrl: data.callback?.failureUrl // Fallback to failureUrl if cancelUrl not provided
      },
      items: [{
        name: data.description,
        value: data.value,
        quantity: 1
      }],
      customerData: data.customerData ? {
        name: data.customerData.name,
        cpfCnpj: data.customerData.cpfCnpj.replace(/[^\d]/g, ''), // Clean CPF format
        email: data.customerData.email,
        phone: data.customerData.phone,
        address: data.customerData.address,
        addressNumber: data.customerData.addressNumber,
        complement: data.customerData.complement,
        postalCode: data.customerData.postalCode ? data.customerData.postalCode.replace(/[^\d]/g, '') : undefined,
        province: data.customerData.province
      } : undefined,
      externalReference: data.externalReference
    };

    console.log(`Sending checkout request to Asaas:`, JSON.stringify(checkoutData, null, 2));

    // Make API request to Asaas
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(checkoutData)
    });

    // Get response body as text first for logging
    const responseText = await response.text();
    console.log(`Asaas checkout response status: ${response.status}, body:`, responseText);

    // Parse response
    const result = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      throw new Error(`Asaas API error: ${result.errors?.[0]?.description || 'Unknown error'}`);
    }

    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}
