
/**
 * Implementation of direct checkout for credit card payments
 * According to Asaas API documentation v3
 */

export async function createDirectCheckout(data: any, apiKey: string, baseUrl: string) {
  try {
    console.log("Creating direct checkout with data:", JSON.stringify(data, null, 2));
    
    // Validate required data
    if (!data.value || !data.description) {
      throw new Error("Value and description are required");
    }
    
    // Prepare customer data for checkout if provided
    let customerData = null;
    if (data.customerData) {
      // Format the customer data according to Asaas documentation
      customerData = {
        name: data.customerData.full_name || data.customerData.name,
        cpfCnpj: data.customerData.cpf || data.customerData.cpfCnpj,
        email: data.customerData.email,
        phone: data.customerData.phone,
        postalCode: data.customerData.postalCode || "01310930", // Use valid postal code to avoid validation errors
        address: data.customerData.address || "Av Paulista",
        addressNumber: data.customerData.addressNumber || "1000",
        province: data.customerData.province || "Bela Vista"
      };
    }
    
    // Normalize payment method
    let billingTypes = [];
    if (data.paymentMethod) {
      // Convert payment method to ASAAS format
      if (data.paymentMethod === 'pix' || data.paymentMethod === 'PIX') {
        billingTypes = ['PIX'];
      } else if (data.paymentMethod === 'credit_card' || data.paymentMethod === 'CREDIT_CARD') {
        billingTypes = ['CREDIT_CARD'];
      } else if (data.paymentMethod === 'boleto' || data.paymentMethod === 'BOLETO') {
        billingTypes = ['BOLETO'];
      } else {
        // Default to all payment methods if not specified or invalid
        billingTypes = ['CREDIT_CARD', 'PIX', 'BOLETO'];
      }
    } else if (data.billingTypes && Array.isArray(data.billingTypes)) {
      // Use the provided billing types if available
      billingTypes = data.billingTypes;
    } else {
      // Default to all payment methods if not specified
      billingTypes = ['CREDIT_CARD', 'PIX', 'BOLETO'];
    }
    
    console.log("Using billing types:", billingTypes);
    
    // Prepare checkout data for Asaas according to v3 API
    const checkoutData = {
      externalReference: data.externalReference,
      value: data.value,
      description: data.description,
      billingTypes: billingTypes,
      chargeType: "DETACHED", // For single payment
      minutesToExpire: 60,
      customer: customerData ? null : undefined,
      customerData: customerData,
      items: data.items || [
        {
          name: data.planName || data.description,
          value: data.value,
          quantity: 1
        }
      ],
      callback: data.callback || {
        successUrl: `${data.callback?.successUrl || "https://app.treinepass.com.br/payment/success"}?subscription=${data.externalReference}`,
        failureUrl: `${data.callback?.failureUrl || "https://app.treinepass.com.br/payment/failure"}?subscription=${data.externalReference}`,
        autoRedirect: true
      }
    };
    
    console.log("Sending checkout data to Asaas:", JSON.stringify(checkoutData, null, 2));
    
    // Make request to Asaas API to create checkout session
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify(checkoutData)
    });
    
    const responseText = await response.text();
    console.log(`Raw API response (${response.status}): ${responseText}`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      throw new Error(`Invalid response from API: ${responseText}`);
    }
    
    if (!response.ok) {
      console.error("Asaas API error:", responseData);
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Unknown error');
    }
    
    if (!responseData.checkoutUrl) {
      console.error('Response without checkout URL:', responseData);
      throw new Error('Checkout URL not received from Asaas');
    }
    
    // Return the successful result
    return {
      success: true,
      id: responseData.id,
      checkoutUrl: responseData.checkoutUrl,
      value: data.value,
      planName: data.planName || data.description,
      planPrice: data.value,
      externalReference: data.externalReference,
      checkoutData: responseData // Return full response data 
    };
    
  } catch (error) {
    console.error("Error creating direct checkout:", error);
    throw new Error(`Error creating direct checkout: ${error.message}`);
  }
}
