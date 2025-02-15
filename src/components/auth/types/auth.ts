
export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
}

export interface UserFormData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  birth_date: string;
  phone_number: string;
}
