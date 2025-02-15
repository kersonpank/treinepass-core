
export interface Gym {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  status: string;
  email: string;
  endereco: string | null;
  horario_funcionamento: Record<string, { abertura: string; fechamento: string }>;
  modalidades: string[];
  automatic_checkin: boolean;
  user_id: string | null;
  usa_regras_personalizadas: boolean;
  categoria_id: string | null;
  fotos: string[];
  created_at: string;
  updated_at: string;
  academia_modalidades: Array<{
    modalidade: {
      id: string;
      nome: string;
    };
  }>;
}
