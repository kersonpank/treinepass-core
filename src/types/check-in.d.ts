
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
