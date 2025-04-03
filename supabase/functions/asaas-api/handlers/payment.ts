
export async function handleCreatePayment(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating payment with data:`, data);
  
  // Validate required fields
  if (!data.customer || !data.value) {
    throw new Error('Payment data incomplete. Customer and value are required.');
  }

  // Set default billing type if not provided
  if (!data.billingType) {
    data.billingType = 'UNDEFINED';
  }

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify(data)
  });

  // Parse response
  const paymentData = await asaasResponse.json();
  console.log(`Asaas payment response:`, paymentData);

  if (!asaasResponse.ok) {
    throw new Error(`Asaas API error: ${paymentData.errors?.[0]?.description || 'Unknown error'}`);
  }

  const response = {
    success: true,
    payment: paymentData
  };

  // If it's a PIX payment, get the QR code
  if (data.billingType === 'PIX') {
    console.log(`Getting PIX QR code for payment ${paymentData.id}`);
    
    const pixResponse = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });

    // Parse PIX response
    const pixData = await pixResponse.json();
    console.log(`Asaas PIX response:`, pixData);

    if (!pixResponse.ok) {
      console.error(`Error getting PIX QR code: ${pixData.errors?.[0]?.description || 'Unknown error'}`);
    } else {
      response.pix = pixData;
    }
  }

  return response;
}

export async function handleGetPayment(data: any, apiKey: string, baseUrl: string) {
  if (!data.id) {
    throw new Error('Payment ID is required.');
  }

  const asaasResponse = await fetch(`${baseUrl}/payments/${data.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    }
  });

  const paymentData = await asaasResponse.json();
  console.log(`Asaas get payment response:`, paymentData);

  if (!asaasResponse.ok) {
    throw new Error(`Asaas API error: ${paymentData.errors?.[0]?.description || 'Unknown error'}`);
  }

  return {
    success: true,
    payment: paymentData
  };
}
