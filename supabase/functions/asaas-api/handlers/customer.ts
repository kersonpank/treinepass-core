
export async function handleCreateCustomer(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating customer with data:`, data);
  
  // Validate required fields
  if (!data.name) {
    throw new Error('Customer name is required');
  }

  // Clean CPF/CNPJ (remove non-numeric characters)
  if (data.cpfCnpj) {
    data.cpfCnpj = data.cpfCnpj.replace(/[^\d]/g, '');
  }

  // Prepare customer data with defaults for required Asaas fields
  const customerData = {
    name: data.name,
    email: data.email || 'cliente@exemplo.com',
    cpfCnpj: data.cpfCnpj || '12345678909',
    mobilePhone: data.mobilePhone || data.phone,
    address: data.address || "Endereço não informado",
    addressNumber: data.addressNumber || "S/N",
    complement: data.complement,
    province: data.province || "Centro", // Bairro
    postalCode: data.postalCode || "00000000",
    notificationDisabled: data.notificationDisabled || false,
    externalReference: data.externalReference
  };

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'Lovable-FitPass-App'
    },
    body: JSON.stringify(customerData)
  });

  // Parse response
  const customerResult = await asaasResponse.json();
  console.log(`Asaas customer response:`, customerResult);

  if (!asaasResponse.ok) {
    throw new Error(`Asaas API error: ${customerResult.errors?.[0]?.description || 'Unknown error'}`);
  }

  return {
    success: true,
    ...customerResult
  };
}
