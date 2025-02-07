
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

export interface CheckInCode {
  id: string;
  code: string;
  user_id: string;
  academia_id: string;
  status: 'active' | 'used' | 'expired';
  expires_at: string;
  used_at?: string | null;
  qr_data: {
    code: string;
    academia_id: string;
  };
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}
