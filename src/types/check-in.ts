
export interface CheckInHistoryItem {
  id: string;
  user_id: string;
  academia_id: string;
  check_in_time: string;
  check_out_time: string | null;
  validation_method: string;
  valor_repasse: number | null;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

export interface CheckInCode {
  id: string;
  code: string;
  user_id: string;
  academia_id: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface CheckInButtonProps {
  academiaId: string;
  onSuccess: (newCode: CheckInCode) => void;
}
