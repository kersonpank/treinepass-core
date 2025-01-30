import { Json } from "@/integrations/supabase/types";

export interface Gym {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  status: string;
  horario_funcionamento: Record<string, any>;
  modalidades?: string[];
  fotos?: string[];
  usa_regras_personalizadas?: boolean;
  categoria_id?: string | null;
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
  valor_repasse_checkin: number;
  active: boolean;
}

export interface RepassRule {
  id: string;
  checkins_minimos: number;
  checkins_maximos?: number | null;
  valor_repasse: number;
}