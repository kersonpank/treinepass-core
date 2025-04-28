
/**
 * Customer handling functions for Asaas API
 */

// Interfaces for type safety
interface CustomerData {
  name: string;
  email?: string;
  cpfCnpj: string;
  mobilePhone?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

/**
 * Find a customer by CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string, apiKey: string, baseUrl: string) {
  try {
    console.log(`Buscando cliente por CPF/CNPJ: ${cpfCnpj}`);
    
    // Format query parameters
    const params = new URLSearchParams({ cpfCnpj });
    
    // Make API request
    const response = await fetch(`${baseUrl}/customers?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      }
    });
    
    // Check for API errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || `API Error: ${response.status}` };
      }
      
      throw new Error(`API Error (${response.status}): ${errorData?.errors?.[0]?.description || errorData?.message || 'Unknown error'}`);
    }
    
    // Parse response data
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      console.log("Empty response received from Asaas API");
      return { data: [] };
    }
    
    const responseData = JSON.parse(responseText);
    
    // Check if customer exists
    if (responseData.data && responseData.data.length > 0) {
      console.log(`Cliente encontrado: ${responseData.data[0].id}`);
      return responseData.data[0];
    }
    
    console.log("Cliente não encontrado");
    return null;
    
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    throw error;
  }
}

/**
 * Create a new customer in Asaas
 */
export async function createCustomer(customerData: CustomerData, apiKey: string, baseUrl: string) {
  console.log(`Creating customer with SDK: ${JSON.stringify(customerData)}`);
  
  try {
    // First check if customer already exists
    let customer;
    try {
      customer = await findCustomerByCpfCnpj(customerData.cpfCnpj, apiKey, baseUrl);
    } catch (e) {
      console.log("Error checking if customer exists, proceeding to create new customer", e);
    }
    
    // If customer exists, return it
    if (customer) {
      console.log(`Customer already exists with id: ${customer.id}`);
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj,
        isExistingCustomer: true
      };
    }
    
    // Customer doesn't exist, create a new one
    console.log("Creating new customer");
    
    // Make API request to create customer
    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify({
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj,
        mobilePhone: customerData.mobilePhone || customerData.phone,
        address: customerData.address,
        addressNumber: customerData.addressNumber,
        complement: customerData.complement,
        province: customerData.province,
        postalCode: customerData.postalCode,
        externalReference: customerData.externalReference,
        notificationDisabled: false
      })
    });
    
    // Check for API errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || `API Error: ${response.status}` };
      }
      
      throw new Error(`API Error (${response.status}): ${errorData?.errors?.[0]?.description || errorData?.message || 'Unknown error'}`);
    }
    
    // Parse response data
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      throw new Error("Empty response received from Asaas API");
    }
    
    const customerResponse = JSON.parse(responseText);
    console.log(`Created new customer with id: ${customerResponse.id}`);
    
    return {
      id: customerResponse.id,
      name: customerResponse.name,
      email: customerResponse.email,
      cpfCnpj: customerResponse.cpfCnpj,
      isExistingCustomer: false
    };
    
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

/**
 * Find or create a customer in Asaas
 */
export async function findOrCreateCustomer(customerData: CustomerData, apiKey: string, baseUrl: string) {
  try {
    console.log("Verificando/criando cliente...");
    
    // First try to find the customer
    let customer;
    try {
      customer = await findCustomerByCpfCnpj(customerData.cpfCnpj, apiKey, baseUrl);
    } catch (e) {
      console.error("Erro ao buscar cliente:", e);
      // We will try to create a new customer
    }
    
    // If customer exists, return it
    if (customer) {
      console.log(`Cliente encontrado: ${customer.id}`);
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj,
        isExistingCustomer: true
      };
    }
    
    // Create new customer
    console.log("Creating customer with SDK:", customerData);
    const newCustomer = await createCustomer(customerData, apiKey, baseUrl);
    
    return {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      cpfCnpj: newCustomer.cpfCnpj,
      isExistingCustomer: false
    };
    
  } catch (error) {
    console.error("Error in findOrCreateCustomer:", error);
    throw error;
  }
}
