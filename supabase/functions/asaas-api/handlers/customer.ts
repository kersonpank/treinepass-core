
export async function handleCreateCustomer(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating customer with data:`, data);
  
  // Validate required fields
  if (!data.name || !data.email || !data.cpfCnpj) {
    throw new Error('Customer data incomplete. Name, email, and cpfCnpj are required.');
  }

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify(data)
  });

  // Parse response
  const asaasData = await asaasResponse.json();
  console.log(`Asaas response:`, asaasData);

  if (!asaasResponse.ok) {
    throw new Error(`Asaas API error: ${asaasData.errors?.[0]?.description || 'Unknown error'}`);
  }

  // Return customer data
  return {
    success: true,
    ...asaasData
  };
}
