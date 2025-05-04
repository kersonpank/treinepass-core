
export interface CheckInCode {
  id: string;
  user_id: string;
  code: string;
  status: 'active' | 'expired' | 'used';
  created_at: string;
  expires_at: string;
  access_token?: string;
  token_expires_at?: string;
}
