export interface CheckInCode {
  id: string;
  user_id: string;
  academia_id: string;
  code: string;
  qr_data: {
    user_id: string;
    academia_id: string;
    generated_at: string;
    code: string;
  };
  created_at: string;
  expires_at: string;
  used_at: string | null;
  status: 'active' | 'used' | 'expired';
}