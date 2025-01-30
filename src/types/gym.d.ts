import { Json } from "@/integrations/supabase/types";

export interface Modalidade {
  id: string;
  nome: string;
}

export interface AcademiaModalidade {
  modalidade: Modalidade;
}

export interface Gym {
  id: string;
  user_id?: string | null;
  nome: string;
  cnpj: string;
  telefone: string | null;
  email: string;
  endereco: string | null;
  horario_funcionamento: Record<string, any> | null;
  modalidades?: string[] | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
  fotos: string[] | null;
  usa_regras_personalizadas?: boolean;
  categoria_id?: string | null;
  academia_modalidades?: AcademiaModalidade[];
  descricao?: string;
}