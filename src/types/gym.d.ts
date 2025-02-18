
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

export interface Gym {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  status: string;
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
