
/**
 * Helper para formatar e validar dados do cliente para o Asaas
 */

export interface CustomerAddress {
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  city?: string;
  state?: string;
}

export interface FormattedCustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  postalCode: string;
}

const DEFAULT_ADDRESS: CustomerAddress = {
  postalCode: "01310930", // CEP válido Av. Paulista
  address: "Av Paulista",
  addressNumber: "1000",
  province: "Bela Vista",
  city: "São Paulo",
  state: "SP"
};

export function formatCustomerData(data: Partial<FormattedCustomerData>): FormattedCustomerData {
  // Formatar CPF/CNPJ - remover caracteres especiais
  const cpfCnpj = data.cpfCnpj?.replace(/[^\d]/g, '') || '';
  
  // Formatar telefone - remover caracteres especiais
  const phone = data.phone?.replace(/[^\d]/g, '') || '';
  
  // Formatar CEP - remover caracteres especiais
  const postalCode = data.postalCode?.replace(/[^\d]/g, '') || DEFAULT_ADDRESS.postalCode;

  return {
    name: data.name || '',
    cpfCnpj,
    email: data.email || '',
    phone,
    address: data.address || DEFAULT_ADDRESS.address,
    addressNumber: data.addressNumber || DEFAULT_ADDRESS.addressNumber,
    complement: data.complement,
    province: data.province || DEFAULT_ADDRESS.province,
    postalCode
  };
}
