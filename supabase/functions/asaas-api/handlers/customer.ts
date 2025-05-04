
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
  
  // Validate required fields
  if (!data.name || !data.cpfCnpj) {
    throw new Error('Customer name and CPF/CNPJ are required');
  }
  
  // Clean CPF/CNPJ (remove special characters)
  const cleanedCpfCnpj = data.cpfCnpj.replace(/[^0-9]/g, '');
  
  try {
    // First check if customer already exists with this CPF/CNPJ
    const searchResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanedCpfCnpj}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });
    
    const searchResult = await searchResponse.json();
    
    // If customer exists, return it
    if (searchResult.data && searchResult.data.length > 0) {
      console.log(`Customer already exists with CPF/CNPJ ${cleanedCpfCnpj}`);
      return {
        id: searchResult.data[0].id,
        name: searchResult.data[0].name,
        email: searchResult.data[0].email,
        cpfCnpj: searchResult.data[0].cpfCnpj,
        isExistingCustomer: true
      };
    }
    
    // If customer doesn't exist, create it
    console.log(`Creating new customer with CPF/CNPJ ${cleanedCpfCnpj}`);
    
    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify({
        ...data,
        cpfCnpj: cleanedCpfCnpj
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating customer: ${response.status} - ${errorText}`);
      throw new Error(`Error creating customer: ${response.status} - ${errorText}`);
    }
    
    const customer = await response.json();
    
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.cpfCnpj,
      isExistingCustomer: false
    };
  } catch (error) {
    console.error(`Error in handleCreateCustomer:`, error);
    throw error;
  }
}
