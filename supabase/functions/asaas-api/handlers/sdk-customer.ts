/**
 * Handler para clientes usando o SDK do Asaas
 */
import { getAsaasConfig, asaasRequest } from '../sdk-config.ts';

export interface CustomerData {
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
 * Formata um nu00famero de telefone para o formato aceito pelo Asaas
 * O Asaas exige o formato: 2 du00edgitos para DDD + 8 ou 9 du00edgitos para o nu00famero
 */
function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Se o nu00famero for muito curto, retornar um formato vu00e1lido padru00e3o
  if (digits.length < 10) {
    console.log(`Phone number too short: ${digits}, using default valid format`);
    return '11999999999'; // Formato vu00e1lido padru00e3o para celular
  }
  
  // Se o nu00famero comeu00e7ar com o cu00f3digo do pau00eds (55), removu00ea-lo
  let phoneWithoutCountry = digits;
  if (digits.startsWith('55') && digits.length > 10) {
    phoneWithoutCountry = digits.substring(2);
  }
  
  // Garantir que temos apenas o DDD (2 du00edgitos) + nu00famero (8-9 du00edgitos)
  if (phoneWithoutCountry.length > 11) {
    phoneWithoutCountry = phoneWithoutCountry.substring(0, 11);
  }
  
  return phoneWithoutCountry;
}

/**
 * Busca um cliente pelo CPF/CNPJ usando o SDK Asaas
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string, apiKey: string, baseUrl: string) {
  console.log(`Buscando cliente por CPF/CNPJ: ${cpfCnpj}`);
  
  try {
    // Configurar API Asaas
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // Limpar o CPF/CNPJ (remover caracteres nu00e3o numu00e9ricos)
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
    
    // Consultar API
    const response = await asaasRequest(
      config, 
      `/customers?cpfCnpj=${encodeURIComponent(cleanCpfCnpj)}`, 
      'GET'
    );
    
    if (response.data && response.data.length > 0) {
      console.log(`Cliente encontrado: ${response.data[0].id}`);
      return response.data[0];
    }
    
    console.log('Cliente nu00e3o encontrado');
    return null;
  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
}

/**
 * Cria um novo cliente ou retorna um existente
 */
export async function createCustomer(data: CustomerData, apiKey: string, baseUrl: string) {
  console.log("Creating customer with SDK:", data);
  
  try {
    // Validar dados obrigatu00f3rios
    if (!data.name || !data.cpfCnpj) {
      throw new Error("Name and cpfCnpj are required");
    }
    
    // Limpar o CPF/CNPJ (remover caracteres nu00e3o numu00e9ricos)
    const cleanCpfCnpj = data.cpfCnpj.replace(/\D/g, '');
    
    // Verificar se o cliente ju00e1 existe
    const existingCustomer = await findCustomerByCpfCnpj(cleanCpfCnpj, apiKey, baseUrl);
    if (existingCustomer) {
      return {
        success: true,
        message: 'Customer already exists',
        customer: existingCustomer
      };
    }
    
    // Configurar API Asaas
    const config = getAsaasConfig(apiKey, baseUrl);
    
    // Tratar CEP invu00e1lido - usar CEP vu00e1lido padru00e3o
    const postalCode = data.postalCode 
      ? data.postalCode.replace(/\D/g, '') 
      : '01310930';
      
    if (postalCode === '00000000') {
      console.log('CEP invu00e1lido detectado, usando CEP padru00e3o');
    }
    
    // Criar cliente com os dados formatados
    const customerData = {
      name: data.name,
      email: data.email,
      cpfCnpj: cleanCpfCnpj,
      mobilePhone: formatPhoneNumber(data.mobilePhone),
      phone: formatPhoneNumber(data.phone),
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement,
      province: data.province,
      postalCode: postalCode === '00000000' ? '01310930' : postalCode,
      notificationDisabled: data.notificationDisabled,
      externalReference: data.externalReference
    };
    
    const customer = await asaasRequest(config, '/customers', 'POST', customerData);
    
    return {
      success: true,
      message: 'Customer created successfully',
      customer
    };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error.response?.data || {}
    };
  }
}

/**
 * Encontra ou cria um cliente
 */
export async function findOrCreateCustomer(customerData: CustomerData, apiKey: string, baseUrl: string) {
  try {
    const existingCustomer = await findCustomerByCpfCnpj(customerData.cpfCnpj, apiKey, baseUrl);
    if (existingCustomer) {
      return {
        success: true,
        customer: existingCustomer,
        isNew: false
      };
    }
    
    const result = await createCustomer(customerData, apiKey, baseUrl);
    if (result.success && result.customer) {
      return {
        success: true,
        customer: result.customer,
        isNew: true
      };
    }
    
    throw new Error(result.error || 'Failed to create customer');
  } catch (error: any) {
    console.error('Error in findOrCreateCustomer:', error);
    throw error;
  }
}
