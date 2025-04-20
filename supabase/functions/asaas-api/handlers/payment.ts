
export async function handleCreatePayment(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating payment with data:`, data);
  
  // Validate required fields
  if (!data.customer || !data.value) {
    throw new Error('Payment data incomplete. Customer and value are required.');
  }

  // Add basic defaults if not provided
  const paymentData = {
    ...data,
    billingType: data.billingType || null, // Permitir que o cliente escolha no checkout do Asaas
    description: data.description || "Pagamento",
    // URLs de redirecionamento após pagamento
    callbackUrl: data.callbackUrl,
    successUrl: data.successUrl || "https://app.treinepass.com.br/payment/success",
    failureUrl: data.failureUrl || "https://app.treinepass.com.br/payment/failure"
  };

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify(paymentData)
  });

  // Parse response
  const paymentResult = await asaasResponse.json();
  console.log(`Asaas payment response:`, paymentResult);

  if (!asaasResponse.ok) {
    throw new Error(`Asaas API error: ${paymentResult.errors?.[0]?.description || 'Unknown error'}`);
  }

  // Check if we need to fetch PIX code for PIX payments
  let pixInfo = {};
  if (data.billingType === 'PIX' && paymentResult.id) {
    try {
      const pixResponse = await fetch(`${baseUrl}/payments/${paymentResult.id}/pixQrCode`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        }
      });

      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        pixInfo = {
          pix: {
            encodedImage: pixData.encodedImage,
            payload: pixData.payload
          }
        };
      }
    } catch (pixError) {
      console.error("Error fetching PIX QR code:", pixError);
    }
  }

  return {
    success: true,
    payment: paymentResult,
    ...pixInfo
  };
}

export async function handleGetPayment(data: any, apiKey: string, baseUrl: string) {
  console.log(`Getting payment with data:`, data);
  
  // Validate required fields
  if (!data.id) {
    throw new Error('Payment ID is required.');
  }

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/payments/${data.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    }
  });

  // Parse response
  const paymentResult = await asaasResponse.json();
  console.log(`Asaas payment get response:`, paymentResult);

  if (!asaasResponse.ok) {
    throw new Error(`Asaas API error: ${paymentResult.errors?.[0]?.description || 'Unknown error'}`);
  }

  return {
    success: true,
    payment: paymentResult
  };
}
