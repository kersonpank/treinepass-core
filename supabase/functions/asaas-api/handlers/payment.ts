
/**
 * Handler para criar pagamento no Asaas
 */

export async function handleCreatePayment(data: any, apiKey: string, baseUrl: string) {
  console.log("Creating payment with data:", data);
  
  try {
    // Validar dados obrigatórios
    if (!data.customer || !data.value || !data.billingType) {
      throw new Error("Customer, value and billingType are required");
    }
    
    // Fazer requisição ao Asaas
    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify(data)
    });

    // Obter resposta
    const paymentResult = await response.json();
    
    if (!response.ok) {
      console.error("Asaas API error:", paymentResult);
      throw new Error(paymentResult.errors?.[0]?.description || 'Unknown error');
    }

    let paymentData = {
      success: true,
      id: paymentResult.id,
      status: paymentResult.status,
      value: paymentResult.value,
      netValue: paymentResult.netValue,
      description: paymentResult.description,
      billingType: paymentResult.billingType,
      customer: paymentResult.customer,
      dueDate: paymentResult.dueDate,
      invoiceUrl: paymentResult.invoiceUrl || null,
      bankSlipUrl: paymentResult.bankSlipUrl || null,
      paymentLink: null
    };
    
    // Adicionar informações específicas do tipo de pagamento
    if (paymentResult.billingType === 'PIX') {
      paymentData.paymentLink = paymentResult.invoiceUrl;
      
      // Tentar obter QR code do PIX se disponível
      try {
        const pixResponse = await fetch(`${baseUrl}/payments/${paymentResult.id}/pixQrCode`, {
          headers: {
            'access_token': apiKey,
            'User-Agent': 'TreinePass-App'
          }
        });
        
        if (pixResponse.ok) {
          const pixData = await pixResponse.json();
          paymentData = {
            ...paymentData,
            pixQrCode: pixData.encodedImage,
            pixCopyPaste: pixData.payload
          };
        }
      } catch (pixError) {
        console.error("Error fetching PIX QR code:", pixError);
        // Não interromper o fluxo se não conseguir obter o QR code
      }
    } else if (paymentResult.billingType === 'CREDIT_CARD') {
      // Criar link de pagamento para cartão de crédito
      try {
        const paymentLinkResponse = await fetch(`${baseUrl}/paymentLinks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
            'User-Agent': 'TreinePass-App'
          },
          body: JSON.stringify({
            billingType: 'CREDIT_CARD',
            chargeType: 'DETACHED',
            name: data.description || 'Pagamento via cartão',
            description: data.description,
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
            value: data.value,
            callback: {
              successUrl: data.successUrl,
              autoRedirect: true
            }
          })
        });
        
        if (paymentLinkResponse.ok) {
          const linkData = await paymentLinkResponse.json();
          paymentData.paymentLink = linkData.url;
        }
      } catch (linkError) {
        console.error("Error creating payment link:", linkError);
      }
    }

    console.log("Payment created successfully:", paymentData);
    return paymentData;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
}
