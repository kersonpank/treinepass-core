
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
  console.log(`Creating checkout session with data:`, JSON.stringify(data, null, 2));
  
  try {
    // Clean up customer data if provided
    let customerData = null;
    if (data.customerData) {
      // Remove undefined values and format data correctly
      customerData = {
        name: data.customerData.name,
        cpfCnpj: data.customerData.cpfCnpj ? data.customerData.cpfCnpj.replace(/[^\d]/g, '') : '',
        email: data.customerData.email
      };
      
      // Only add optional fields if they exist and are not undefined
      if (data.customerData.phone) {
        customerData.phone = data.customerData.phone.replace(/\D/g, '');
      }
      
      if (typeof data.customerData.address === 'string') {
        customerData.address = data.customerData.address;
      }
      
      if (typeof data.customerData.postalCode === 'string') {
        customerData.postalCode = data.customerData.postalCode.replace(/\D/g, '');
      }
      
      if (typeof data.customerData.province === 'string') {
        customerData.province = data.customerData.province;
      }
    }

    // Prepare the checkout session request
    const checkoutData = {
      billingTypes: data.billingTypes,
      chargeTypes: data.chargeTypes,
      minutesToExpire: data.minutesToExpire || 60,
      items: [{
        name: data.description,
        value: data.value,
        quantity: 1
      }],
      externalReference: data.externalReference
    };
    
    // Only add callback URLs if they exist
    if (data.callback) {
      checkoutData['callback'] = {};
      if (data.callback.successUrl) {
        checkoutData['callback'].successUrl = data.callback.successUrl;
      }
      if (data.callback.failureUrl) {
        checkoutData['callback'].failureUrl = data.callback.failureUrl;
      }
      if (data.callback.cancelUrl) {
        checkoutData['callback'].cancelUrl = data.callback.cancelUrl || data.callback.failureUrl;
      }
    }
    
    // Only add customer data if it exists
    if (customerData) {
      checkoutData['customerData'] = customerData;
    }

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
      console.error(`Asaas API error:`, result);
      throw new Error(`Asaas API error: ${result.errors?.[0]?.description || result.message || 'Unknown error'}`);
    }

    return {
      success: true,
      checkoutUrl: `https://asaas.com/checkoutSession/show?id=${result.id}`,
      ...result
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}
