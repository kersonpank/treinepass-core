
/**
 * Handler para criar sessão de checkout no Asaas
 */

export async function handleCreateCheckout(data: any, apiKey: string, baseUrl: string) {
  console.log("Creating checkout session with data:", data);
  
  try {
    // Validar dados obrigatórios
    if (!data.value || !data.items) {
      throw new Error("Value and items are required");
    }
    
    // Garantir que temos dados válidos de CEP para o cliente, se fornecidos
    if (data.customerData && data.customerData.postalCode) {
      data.customerData.postalCode = data.customerData.postalCode.replace(/[^\d]/g, '');
      // Se o CEP não tiver 8 dígitos, usar um valor padrão válido
      if (data.customerData.postalCode.length !== 8) {
        data.customerData.postalCode = "01310930"; // CEP válido para São Paulo
      }
    }
    
    // Fazer requisição ao Asaas
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify(data)
    });

    // Obter resposta
    const checkoutResult = await response.json();
    console.log("Asaas checkout response:", checkoutResult);

    if (!response.ok) {
      console.error("Asaas API error:", checkoutResult);
      throw new Error(checkoutResult.errors?.[0]?.description || 'Unknown error');
    }

    return {
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      id: checkoutResult.id,
      status: checkoutResult.status,
      value: data.value
    };
  } catch (error) {
    console.error("Error creating checkout:", error);
    throw error;
  }
}
