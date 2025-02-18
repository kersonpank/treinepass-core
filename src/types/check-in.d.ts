
export interface CheckInCode {
  id: string;
  user_id: string;
  academia_id: string;
  code: string;
  expires_at: string;
  status: 'active' | 'used' | 'expired';
  created_at: string;
}
