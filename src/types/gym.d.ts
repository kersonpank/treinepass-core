<<<<<<< HEAD

export interface GymModalidade {
  modalidade: {
    id: string;
    nome: string;
  };
}

export interface GymDocumento {
  id?: string;
  nome: string;
  tipo: string;
  caminho: string;
  status?: string;
  observacoes?: string;
}

export interface GymHorario {
  abertura: string;
  fechamento: string;
}
=======
>>>>>>> main

export interface Gym {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  status: string;
<<<<<<< HEAD
  email: string;
  endereco: string | null;
  horario_funcionamento: Record<string, GymHorario>;
  modalidades: string[];
  automatic_checkin: boolean;
  user_id: string | null;
  usa_regras_personalizadas: boolean;
  categoria_id: string | null;
  fotos: string[];
  documentos: GymDocumento[];
  created_at: string;
  updated_at: string;
  academia_modalidades: GymModalidade[];
  categoria?: {
    nome: string;
    valor_repasse_checkin: number;
  };
}
=======
  horario_funcionamento: Record<string, any>;
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
  deleted_at?: string | null;
  deleted_by_gym?: boolean;
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
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

export interface CheckInValidation {
  can_check_in: boolean;
  message: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
}
>>>>>>> main
