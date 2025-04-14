
export async function handleCreatePaymentLink(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating payment link with data:`, data);
  
  // Validate required fields
  if (!data.customer || !data.value) {
    throw new Error('Payment link data incomplete. Customer and value are required.');
  }
  
  // Prepare payment link request body with improved metadata
  const paymentLinkData = {
    customer: data.customer,
    billingType: data.billingType || "UNDEFINED", // Allow customer to choose payment method if not specified
    value: data.value,
    name: data.name || "Assinatura de Plano",
    description: data.description || "Assinatura de plano", 
    dueDateLimitDays: data.dueDateLimitDays || 5,
    maxInstallmentCount: data.maxInstallmentCount || 12, // Allow up to 12 installments
    chargeType: data.chargeType || "DETACHED",
    externalReference: data.externalReference,
    notificationEnabled: true,
    // URLs de redirecionamento após pagamento
    successUrl: data.successUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/success",
    failureUrl: data.failureUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/failure"
  };

  console.log("Payment link request:", paymentLinkData);
  
  try {
    // Make API request to Asaas
    const asaasResponse = await fetch(`${baseUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentLinkData)
    });
    
    // Parse response
    const paymentLinkResult = await asaasResponse.json();
    console.log(`Asaas payment link response:`, paymentLinkResult);
    
    if (!asaasResponse.ok) {
      throw new Error(`Asaas API error: ${paymentLinkResult.errors?.[0]?.description || 'Unknown error'}`);
    }
    
    // Calculate due date if not provided
    const dueDate = data.dueDateLimitDays 
      ? new Date(new Date().setDate(new Date().getDate() + data.dueDateLimitDays)).toISOString().split('T')[0]
      : new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];

    // Return payment link data with all needed information
    return {
      success: true,
      id: paymentLinkResult.id,
      paymentLink: paymentLinkResult.url,
      value: paymentLinkResult.value,
      dueDate: dueDate
    };
  } catch (error) {
    console.error("Error creating payment link:", error);
    
    // Try creating a regular payment as fallback
    console.log("Trying to create regular payment as fallback...");
    
    const paymentData = {
      customer: data.customer,
      billingType: data.billingType || "UNDEFINED", // Allow customer to choose payment method
      value: data.value,
      description: data.description || "Assinatura de plano",
      dueDate: new Date(new Date().setDate(new Date().getDate() + (data.dueDateLimitDays || 5))).toISOString().split('T')[0],
      externalReference: data.externalReference,
      // URLs de redirecionamento para o fallback
      callbackUrl: data.callbackUrl || process.env.WEBHOOK_URL,
      successUrl: data.successUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/success",
      failureUrl: data.failureUrl || process.env.WEBAPP_URL || "https://app.mkbr.com.br/payment/failure"
    };
    
    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      throw new Error(`Asaas API error (fallback payment): ${errorData.errors?.[0]?.description || 'Unknown error'}`);
    }
    
    const payment = await paymentResponse.json();
    
    // Return payment data in place of payment link
    return {
      success: true,
      payment: payment,
      id: payment.id,
      value: payment.value,
      dueDate: payment.dueDate,
      paymentLink: payment.invoiceUrl // Use invoiceUrl as paymentLink
    };
  }
}
