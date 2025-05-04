
-- Create check_in_codes table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS check_in_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  academia_id UUID REFERENCES academias(id) ON DELETE SET NULL,
  CONSTRAINT check_in_codes_status_check CHECK (status IN ('active', 'expired', 'used'))
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS check_in_codes_user_id_idx ON check_in_codes(user_id);
CREATE INDEX IF NOT EXISTS check_in_codes_status_idx ON check_in_codes(status);
CREATE INDEX IF NOT EXISTS check_in_codes_code_idx ON check_in_codes(code);

-- Add columns to WebhookEventBadge if they don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'mercadopago_webhook_events'
    AND column_name = 'signature_valid'
  ) THEN
    ALTER TABLE mercadopago_webhook_events ADD COLUMN signature_valid BOOLEAN;
  END IF;
END
$$;
