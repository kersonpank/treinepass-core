
export async function handleCreateCustomer(data: any, apiKey: string, baseUrl: string) {
  console.log(`Creating customer with data:`, data);
  
  // Validate required fields
  if (!data.name) {
    throw new Error('Customer name is required');
  }

  // Prepare customer data with defaults
  const customerData = {
    name: data.name,
    email: data.email || 'cliente@exemplo.com',
    cpfCnpj: data.cpfCnpj || '12345678909',
    mobilePhone: data.mobilePhone,
    address: data.address,
    addressNumber: data.addressNumber,
    complement: data.complement,
    province: data.province, // Bairro
    postalCode: data.postalCode,
    notificationDisabled: false,
    externalReference: data.externalReference
  };
  
  // Clean CPF/CNPJ (remove non-numeric characters)
  if (customerData.cpfCnpj) {
    customerData.cpfCnpj = customerData.cpfCnpj.replace(/[^\d]/g, '');
  }

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
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
