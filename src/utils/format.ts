
/**
 * Funções de formatação para valores monetários, datas e outros
 */

/**
 * Formata um valor para o formato monetário brasileiro (R$)
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/**
 * Formata um CPF ou CNPJ
 */
export function formatCpfCnpj(value: string): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Formata como CPF
  if (cleanValue.length <= 11) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  // Formata como CNPJ
  return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata um número de telefone
 */
export function formatPhone(value: string): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Telefone com DDD e 9 dígitos
  if (cleanValue.length === 11) {
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  // Telefone com DDD e 8 dígitos
  if (cleanValue.length === 10) {
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return cleanValue;
}

/**
 * Extrai o token da API do Asaas do formato da chave bruta
 * Formato: $aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ3YjczYzA0LWVmMTEtNDk1Ny1hZjI1LTlhNzZlNGRiMjgyOA
 * Resultado: MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ3YjczYzA0LWVmMTEtNDk1Ny1hZjI1LTlhNzZlNGRiMjgyOA
 */
export function extractAsaasApiToken(key: string | null | undefined): string | null {
  if (!key) return null;
  
  try {
    // Se a chave começar com $aact_, extrair apenas a parte do token
    if (key.startsWith('$aact_')) {
      const tokenPart = key.substring(6); // Remove '$aact_'
      // Se houver ::, pegar apenas a primeira parte
      const endIndex = tokenPart.indexOf('::');
      return endIndex > 0 ? tokenPart.substring(0, endIndex) : tokenPart;
    }
    
    return key; // Se não tiver o prefixo, retornar como está
  } catch (error) {
    console.error("Erro ao extrair token da API do Asaas:", error);
    return key; // Em caso de erro, retornar a chave original
  }
}
