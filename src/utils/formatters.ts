/**
 * Utilitários para formatação de dados
 */

/**
 * Normaliza um número de telefone para o formato aceito pelo Asaas
 * Remove caracteres não numéricos e garante o formato correto
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '');
  
  // Se o número for muito curto, retornar um formato válido padrão
  if (digits.length < 10) {
    console.log(`Número de telefone muito curto: ${digits}, usando formato válido padrão`);
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
  
  return phoneWithoutCountry;
}

/**
 * Normaliza um CPF/CNPJ para o formato aceito pelo Asaas
 * Remove caracteres não numéricos
 */
export function normalizeCpfCnpj(cpfCnpj: string | null | undefined): string | null {
  if (!cpfCnpj) return null;
  
  // Remove todos os caracteres não numéricos
  return cpfCnpj.replace(/\D/g, '');
}

/**
 * Normaliza um CEP para o formato aceito pelo Asaas
 * Remove caracteres não numéricos e garante um CEP válido
 */
export function normalizePostalCode(postalCode: string | null | undefined): string {
  if (!postalCode) return '01310930'; // CEP válido padrão para São Paulo
  
  // Remove todos os caracteres não numéricos
  const cleanPostalCode = postalCode.replace(/\D/g, '');
  
  // Verificar se é um CEP inválido (00000000) ou muito curto
  if (cleanPostalCode === '00000000' || cleanPostalCode.length < 8) {
    return '01310930'; // CEP válido padrão para São Paulo
  }
  
  return cleanPostalCode;
}
