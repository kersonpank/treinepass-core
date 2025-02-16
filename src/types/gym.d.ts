
export interface GymHours {
  [key: string]: {
    abertura?: string;
    fechamento?: string;
  };
}

export interface GymPhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymId: string;
  fotos: string[];
  onSuccess: () => void;
}

export interface Gym {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: string;
  horario_funcionamento: GymHours;
  fotos: string[];
  modalidades: string[];
  status: string;
  automatic_checkin: boolean;
  categoria_id?: string;
}
