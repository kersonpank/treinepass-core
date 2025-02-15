
export interface CheckInCode {
  id: string;
  code: string;
  status: string;
  expires_at: string;
  created_at: string;
  user_id: string;
  qr_data?: {
    code: string;
    timestamp: string;
    userId: string;
  };
}

export interface CheckInHistoryItem {
  id: string;
  check_in_time: string;
  check_out_time?: string;
  status: string;
  validation_method: string;
  code?: string;
  access_token?: string;
  user_profile?: {
    full_name: string;
    email: string;
    cpf: string;
  };
}
