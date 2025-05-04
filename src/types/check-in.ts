
export interface CheckInCode {
  id: string;
  user_id: string;
  code: string;
  status: 'active' | 'expired' | 'used';
  created_at: string;
  expires_at: string;
  used_at?: string;
  academia_id?: string;
}
