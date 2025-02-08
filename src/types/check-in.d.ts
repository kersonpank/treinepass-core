
export interface CheckInHistoryItem {
  id: string;
  user_id: string;
  academia_id: string;
  check_in_time: string;
  check_out_time: string | null;
  validation_method: 'qr_code' | 'token';
  valor_repasse: number | null;
  user?: {
    full_name: string;
    email: string;
    cpf: string;
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

export interface CheckInValidation {
  can_check_in: boolean;
  message: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
}
