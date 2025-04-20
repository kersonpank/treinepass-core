/**
 * Handlers for Asaas customer management
 */

interface AsaasCustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}

/**
 * Find a customer by CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string, apiKey: string, baseUrl: string) {
  try {
    // Format CPF/CNPJ - remove non-numeric characters
    const formattedCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');
    
    console.log(`Searching for customer with CPF/CNPJ: ${formattedCpfCnpj}`);
    
    // Search for customer by CPF/CNPJ
    const response = await fetch(`${baseUrl}/customers?cpfCnpj=${formattedCpfCnpj}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });

    const responseData = await response.json();
    console.log(`Customer search response:`, responseData);

    if (response.ok && responseData.data && responseData.data.length > 0) {
      // Return the first customer found
      return {
        success: true,
        customer: responseData.data[0]
      };
    }

    return {
      success: false,
      message: 'Customer not found'
    };
  } catch (error) {
    console.error('Error finding customer:', error);
    return {
      success: false,
      message: `Error finding customer: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Create a new customer in Asaas
 */
export async function createCustomer(customerData: AsaasCustomerData, apiKey: string, baseUrl: string) {
  try {
    console.log(`Creating new customer:`, customerData);
    
    // Format CPF/CNPJ - remove non-numeric characters
    const formattedCpfCnpj = customerData.cpfCnpj.replace(/[^\d]/g, '');
    
    // Format phone numbers - remove non-numeric characters
    let phone = customerData.phone;
    if (phone) {
      phone = phone.replace(/[^\d]/g, '');
    }
    
    // Format postal code - remove non-numeric characters
    let postalCode = customerData.postalCode;
    if (postalCode) {
      postalCode = postalCode.replace(/[^\d]/g, '');
      // Ensure it's a valid postal code
      if (!postalCode || postalCode.length !== 8 || postalCode === "00000000") {
        postalCode = "01310930"; // Default to a valid postal code (Av. Paulista, SP)
      }
    }
    
    // Prepare customer data with formatted values
    const formattedCustomerData = {
      ...customerData,
      cpfCnpj: formattedCpfCnpj,
      phone: phone,
      postalCode: postalCode
    };
    
    // Create customer in Asaas
    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(formattedCustomerData)
    });

    const responseData = await response.json();
    console.log(`Customer creation response:`, responseData);

    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.description || responseData.message || 'Unknown error');
    }

    return {
      success: true,
      customer: responseData
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      success: false,
      message: `Error creating customer: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Find or create a customer in Asaas
 */
export async function findOrCreateCustomer(customerData: AsaasCustomerData, apiKey: string, baseUrl: string) {
  try {
    // First, try to find the customer by CPF/CNPJ
    const findResult = await findCustomerByCpfCnpj(customerData.cpfCnpj, apiKey, baseUrl);
    
    if (findResult.success) {
      console.log(`Customer found:`, findResult.customer);
      return {
        success: true,
        customer: findResult.customer,
        isNew: false
      };
    }
    
    // If customer not found, create a new one
    const createResult = await createCustomer(customerData, apiKey, baseUrl);
    
    if (createResult.success) {
      return {
        success: true,
        customer: createResult.customer,
        isNew: true
      };
    }
    
    return {
      success: false,
      message: createResult.message
    };
  } catch (error) {
    console.error('Error in find or create customer:', error);
    return {
      success: false,
      message: `Error in find or create customer: ${error.message || 'Unknown error'}`
    };
  }
}
