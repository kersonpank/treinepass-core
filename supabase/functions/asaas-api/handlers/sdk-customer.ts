
/**
 * SDK-style handler for customer operations in Asaas API
 */
import { asaasRequest, getAsaasConfig } from '../sdk-config.ts';

export interface CustomerData {
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

// Find customer by CPF/CNPJ
export async function findCustomerByCpfCnpj(cpfCnpj: string, apiKey: string, baseUrl: string) {
  try {
    const config = getAsaasConfig(apiKey, baseUrl);
    const sanitizedCpfCnpj = cpfCnpj.replace(/\D/g, '');
    const result = await asaasRequest(config, `/customers?cpfCnpj=${sanitizedCpfCnpj}`, 'GET');
    
    if (result && result.data && result.data.length > 0) {
      console.log(`Customer found with ID: ${result.data[0].id}`);
      return result.data[0];
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    throw error;
  }
}

// Create customer in Asaas
export async function createCustomer(data: CustomerData, apiKey: string, baseUrl: string) {
  try {
    console.log("Creating customer with SDK:", data);
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // Check if customer already exists
    try {
      const existingCustomer = await findCustomerByCpfCnpj(data.cpfCnpj, apiKey, baseUrl);
      if (existingCustomer) {
        console.log("Customer already exists:", existingCustomer);
        return {
          success: true,
          customer: existingCustomer,
          isExistingCustomer: true
        };
      }
    } catch (searchError) {
      console.error("Error checking if customer exists, proceeding to create new customer", searchError);
    }
    
    console.log("Creating new customer");
    
    // Ensure email is provided (required by Asaas)
    if (!data.email) {
      data.email = `${data.cpfCnpj}@cliente.com.br`;
    }
    
    // Prepare customer data
    const customerPayload = {
      name: data.name,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
      email: data.email,
      phone: data.phone,
      mobilePhone: data.mobilePhone || data.phone,
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement,
      province: data.province,
      postalCode: data.postalCode?.replace(/\D/g, ''),
      externalReference: data.externalReference,
      notificationDisabled: false
    };
    
    // Create customer in Asaas
    const customer = await asaasRequest(config, '/customers', 'POST', customerPayload);
    
    console.log(`New customer created with ID: ${customer.id}`);
    
    return {
      success: true,
      customer,
      isExistingCustomer: false
    };
  } catch (error) {
    console.error("Error creating customer:", error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error.response?.data || {}
    };
  }
}

// Find or create customer in one operation
export async function findOrCreateCustomer(data: CustomerData, apiKey: string, baseUrl: string) {
  try {
    // Validate required fields
    if (!data.name || !data.cpfCnpj) {
      throw new Error("Name and CPF/CNPJ are required fields");
    }
    
    // Sanitize CPF/CNPJ
    const sanitizedCpfCnpj = data.cpfCnpj.replace(/\D/g, '');
    
    // First try to find customer by CPF/CNPJ
    try {
      console.log(`Buscando cliente por CPF/CNPJ: ${sanitizedCpfCnpj}`);
      const existingCustomer = await findCustomerByCpfCnpj(sanitizedCpfCnpj, apiKey, baseUrl);
      
      if (existingCustomer) {
        return {
          success: true,
          customer: existingCustomer,
          isExistingCustomer: true
        };
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      // Continue to create customer if not found
    }
    
    // Customer not found, create new one
    return await createCustomer(data, apiKey, baseUrl);
  } catch (error) {
    console.error("Error in findOrCreateCustomer:", error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error.response?.data || {}
    };
  }
}
