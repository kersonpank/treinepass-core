
interface CustomerData {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

export async function handleCreateCustomer(data: CustomerData, apiKey: string, baseUrl: string) {
  console.log(`Creating or finding customer with data:`, data);
  
  // Validar campos obrigatórios
  if (!data.name || !data.cpfCnpj) {
    throw new Error('Customer name and cpfCnpj are required');
  }
  
  // Primeiro verificar se o cliente já existe pelo CPF/CNPJ
  try {
    const searchResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${data.cpfCnpj}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });
    
    const searchResult = await searchResponse.json();
    
    if (searchResponse.ok && searchResult.data && searchResult.data.length > 0) {
      const existingCustomer = searchResult.data[0];
      console.log(`Customer already exists with ID: ${existingCustomer.id}`);
      return {
        id: existingCustomer.id,
        name: existingCustomer.name,
        cpfCnpj: existingCustomer.cpfCnpj,
        email: existingCustomer.email,
        isExistingCustomer: true
      };
    }
  } catch (searchError) {
    console.error("Error searching for customer:", searchError);
    // Continue to create a new customer
  }
  
  // Cliente não existe, criar um novo
  console.log("Customer not found, creating new one");
  
  // Preparar dados para criação do cliente
  const customerData = {
    name: data.name,
    cpfCnpj: data.cpfCnpj,
    email: data.email || `${data.cpfCnpj}@cliente.com.br`, // Email é obrigatório na API do Asaas
    mobilePhone: data.mobilePhone || data.phone,
    address: data.address,
    addressNumber: data.addressNumber,
    complement: data.complement,
    province: data.province,
    postalCode: data.postalCode,
    externalReference: data.externalReference,
    notificationDisabled: false
  };
  
  try {
    // Fazer requisição para a API do Asaas
    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(customerData)
    });
    
    // Log da resposta bruta para debug
    const responseText = await response.text();
    console.log(`Raw Asaas customer create response:`, responseText);
    
    // Parse da resposta
    const customerResult = JSON.parse(responseText);
    
    if (!response.ok) {
      throw new Error(`Asaas API error: ${customerResult.errors?.[0]?.description || customerResult.message || 'Unknown error'}`);
    }
    
    console.log(`New customer created with ID: ${customerResult.id}`);
    
    // Retornar dados do cliente criado
    return {
      id: customerResult.id,
      name: customerResult.name,
      cpfCnpj: customerResult.cpfCnpj,
      email: customerResult.email,
      isExistingCustomer: false
    };
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}
