
import { Json } from "@/integrations/supabase/types";

export interface Gym {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  status: string;
  horario_funcionamento: Json;
  modalidades?: string[];
  fotos?: string[];
  usa_regras_personalizadas?: boolean;
  categoria_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  automatic_checkin?: boolean;
  academia_modalidades?: {
    modalidade: {
      id: string;
      nome: string;
    };
  }[];
}

export interface GymCategory {
  id: string;
  nome: string;
  descricao: string | null;
  active: boolean;
}
