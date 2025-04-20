export interface UserFormData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  birth_date: string;
  phone: string;
  // Campos de endereço
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  // Campo auxiliar para controle de loading
  cep_loading?: boolean;
}