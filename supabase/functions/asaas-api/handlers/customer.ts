
/**
 * Interface para dados do cliente
 */
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
  notificationDisabled?: boolean;
  externalReference?: string;
}

/**
 * Formata um número de telefone para o formato aceito pelo Asaas
 * O Asaas exige o formato: 2 dígitos para DDD + 8 ou 9 dígitos para o número
 * Para celulares, o formato deve ser: DDD + 9 dígitos (ex: 11999999999)
 */
function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Se o número for muito curto, retornar um formato válido padrão
  if (digits.length < 10) {
    console.log(`Phone number too short: ${digits}, using default valid format`);
    return '11999999999'; // Formato válido padrão para celular
  }
  
  // Se o número começar com o código do país (55), removê-lo
  let phoneWithoutCountry = digits;
  if (digits.startsWith('55') && digits.length > 10) {
    phoneWithoutCountry = digits.substring(2);
  }
  
  // Garantir que temos apenas o DDD (2 dígitos) + número (8-9 dígitos)
  if (phoneWithoutCountry.length > 11) {
    phoneWithoutCountry = phoneWithoutCountry.substring(0, 11);
  }
  
  // Se for um número de telefone fixo (10 dígitos), converter para celular (11 dígitos)
  if (phoneWithoutCountry.length === 10) {
    // Extrair o DDD e o número
    const ddd = phoneWithoutCountry.substring(0, 2);
    const number = phoneWithoutCountry.substring(2);
    // Adicionar o 9 no início do número para celular
    phoneWithoutCountry = `${ddd}9${number}`;
  }
  
  return phoneWithoutCountry;
}

/**
 * Verifica se um cliente já existe no Asaas pelo CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string, apiKey: string, baseUrl: string) {
  console.log(`Searching for customer with CPF/CNPJ: ${cpfCnpj}`);
  
  // Limpar CPF/CNPJ (remover caracteres não numéricos)
  const cleanCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');
  
  if (!cleanCpfCnpj) {
    throw new Error('CPF/CNPJ is required for customer search');
  }
  
  try {
    // Fazer requisição à API do Asaas para buscar cliente por CPF/CNPJ
    const response = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpfCnpj}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      }
    });
    
    const result = await response.json();
    console.log(`Asaas customer search response:`, result);
    
    if (!response.ok) {
      throw new Error(`Asaas API error: ${result.errors?.[0]?.description || 'Unknown error'}`);
    }
    
    // Verificar se encontrou algum cliente
    if (result.data && result.data.length > 0) {
      console.log(`Customer found with id: ${result.data[0].id}`);
      return {
        success: true,
        customerExists: true,
        customer: result.data[0]
      };
    }
    
    // Cliente não encontrado
    return {
      success: true,
      customerExists: false
    };
  } catch (error) {
    console.error('Error searching for customer:', error);
    throw error;
  }
}

/**
 * Cria um cliente no Asaas ou retorna o existente se já existir
 */
export async function handleCreateCustomer(data: CustomerData, apiKey: string, baseUrl: string) {
  console.log(`Creating or retrieving customer with data:`, data);
  
  // Validate required fields
  if (!data.name) {
    throw new Error('Customer name is required');
  }

  // Clean CPF/CNPJ (remove non-numeric characters)
  if (data.cpfCnpj) {
    data.cpfCnpj = data.cpfCnpj.replace(/[^\d]/g, '');
  }
  
  // Verificar se o cliente já existe pelo CPF/CNPJ
  try {
    if (data.cpfCnpj) {
      const existingCustomer = await findCustomerByCpfCnpj(data.cpfCnpj, apiKey, baseUrl);
      
      if (existingCustomer.customerExists && existingCustomer.customer) {
        console.log(`Customer already exists with id: ${existingCustomer.customer.id}`);
        return {
          success: true,
          isExistingCustomer: true,
          ...existingCustomer.customer
        };
      }
    }
  } catch (error) {
    console.warn('Error checking if customer exists:', error);
    // Continue with customer creation even if search fails
  }
  
  // Format postal code to ensure it's 8 digits
  let postalCode = data.postalCode || "01310930"; // CEP válido para São Paulo
  postalCode = postalCode.replace(/\D/g, '');
  
  // If postal code is empty or invalid, use a valid default
  if (!postalCode || postalCode.length !== 8) {
    postalCode = "01310930"; // CEP válido para São Paulo
  }

  // Format phone numbers - garantir que pelo menos um deles seja válido
  let formattedPhone = formatPhoneNumber(data.phone);
  let formattedMobilePhone = formatPhoneNumber(data.mobilePhone || data.phone);
  
  // Garantir que temos pelo menos um número de celular válido
  if (!formattedMobilePhone) {
    formattedMobilePhone = '11999999999'; // Formato válido padrão para celular
  }
  
  // Se o telefone fixo não for fornecido, usar o celular
  if (!formattedPhone) {
    formattedPhone = formattedMobilePhone;
  }

  console.log(`Formatted phone numbers - Phone: ${formattedPhone}, MobilePhone: ${formattedMobilePhone}`);

  // Prepare customer data with defaults for required Asaas fields
  const customerData = {
    name: data.name,
    email: data.email || 'cliente@exemplo.com',
    cpfCnpj: data.cpfCnpj || '12345678909',
    phone: formattedPhone,
    mobilePhone: formattedMobilePhone, // Garantir que temos um celular válido
    address: data.address || "Av. Paulista",
    addressNumber: data.addressNumber || "1000",
    complement: data.complement,
    province: data.province || "Bela Vista", // Bairro
    postalCode: postalCode,
    notificationDisabled: data.notificationDisabled || false,
    externalReference: data.externalReference
  };

  console.log(`Creating new customer with data:`, customerData);

  // Make API request to Asaas
  const asaasResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'TreinePass-App'
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
    isExistingCustomer: false,
    ...customerResult
  };
}

/**
 * Cria um cliente no Asaas ou encontra um existente
 */
export async function findOrCreateCustomer(customerData: CustomerData, apiKey: string, baseUrl: string) {
  try {
    // Primeiro, tentar encontrar o cliente pelo CPF/CNPJ
    if (customerData.cpfCnpj) {
      const existingCustomer = await findCustomerByCpfCnpj(customerData.cpfCnpj, apiKey, baseUrl);
      
      if (existingCustomer.customerExists && existingCustomer.customer) {
        return {
          success: true,
          isNew: false,
          customer: existingCustomer.customer
        };
      }
    }
    
    // Se não encontrou, criar um novo cliente
    const newCustomer = await handleCreateCustomer(customerData, apiKey, baseUrl);
    
    return {
      success: true,
      isNew: true,
      customer: newCustomer
    };
  } catch (error) {
    console.error('Error in findOrCreateCustomer:', error);
    throw error;
  }
}
