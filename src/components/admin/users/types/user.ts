export interface UserType {
  type: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  created_at: string;
  user_types: UserType[];
  active: boolean;
}