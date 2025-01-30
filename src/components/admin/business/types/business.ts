export interface Business {
  id: string;
  company_name: string;
  cnpj: string;
  email: string;
  phone: string;
  status: string;
  number_of_employees: number;
  industry?: string;
  contact_person: string;
  contact_position: string;
  address: string;
  created_at: string;
}