
export interface CheckInHistoryItem {
  id: string;
  created_at: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  academia?: {
    nome: string;
  };
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

export interface CheckInButtonProps {
  academiaId: string;
  onSuccess: (newCode: CheckInCode) => void;
}

export interface CheckInDisplayProps {
  code: CheckInCode;
  onClose: () => void;
}
