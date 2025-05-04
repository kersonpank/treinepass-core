
interface CustomerData {
  name: string;
  cpfCnpj: string;
  email?: string;
}

interface DirectCheckoutData {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  amount: number;
  description?: string;
  externalReference?: string;
  dueDate?: string;
  installments?: number;
  paymentMethod?: string;
  successUrl?: string;
  failureUrl?: string;
}

export async function createDirectCheckout(data: DirectCheckoutData, apiKey: string, baseUrl: string) {
  console.log(`Creating direct checkout with data:`, data);

  try {
    // Prepare payment data
    const paymentData = {
      customer: null, // We don't have a customer ID yet
      billingType: data.paymentMethod || "UNDEFINED", // Allow customer to choose in checkout
      value: data.amount,
      dueDate: data.dueDate || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      description: data.description || "Pagamento TreinePass",
      externalReference: data.externalReference,
      installmentCount: data.installments || 1,
      successUrl: data.successUrl,
      failureUrl: data.failureUrl,
      
      // Customer data for new customer creation
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj
    };

    // Make request to Asaas API
    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    });

    // Parse response
    const responseText = await response.text();
    console.log(`Raw Asaas response:`, responseText);
    
    let paymentResult;
    try {
      paymentResult = JSON.parse(responseText);
    } catch (e) {
      console.error(`Error parsing response:`, e);
      return {
        success: false,
        error: { message: `Error parsing Asaas response` }
      };
    }

    // Handle errors
    if (!response.ok) {
      console.error(`Asaas API error:`, paymentResult);
      return {
        success: false,
        error: { 
          message: paymentResult.errors?.[0]?.description || paymentResult.message || 'Unknown error'
        }
      };
    }

    // Return success result
    return {
      success: true,
      paymentId: paymentResult.id,
      url: paymentResult.invoiceUrl || paymentResult.bankSlipUrl,
      value: paymentResult.value,
      dueDate: paymentResult.dueDate,
      externalReference: data.externalReference
    };
  } catch (error) {
    console.error(`Error creating direct checkout:`, error);
    return {
      success: false,
      error: error
    };
  }
}
