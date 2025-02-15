
export interface UserType {
  type: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  phone_number: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
  active: boolean;
  user_types: UserType[];
}
