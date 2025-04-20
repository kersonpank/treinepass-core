
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
    
    // Fazer requisição ao Asaas
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
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
