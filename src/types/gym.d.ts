
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

export interface GymDocument {
  id: string;
  academia_id: string;
  nome: string;
  tipo: string;
  caminho: string;
  observacoes?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  revisado_por?: string;
  created_at?: string;
  updated_at?: string;
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

export interface CheckInValidation {
  can_check_in: boolean;
  message: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
}
