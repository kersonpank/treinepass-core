
-- Create check_in_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS check_in_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  academia_id UUID REFERENCES academias(id) ON DELETE SET NULL,
  
  CONSTRAINT check_status CHECK (status IN ('active', 'expired', 'used'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_check_in_codes_user_id ON check_in_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_codes_status ON check_in_codes(status);
CREATE INDEX IF NOT EXISTS idx_check_in_codes_academia_id ON check_in_codes(academia_id);

-- Create mercadopago_webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS mercadopago_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT,
  event_type TEXT,
  payload JSONB,
  status TEXT DEFAULT 'received',
  signature_valid BOOLEAN,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhook_events_event_id ON mercadopago_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhook_events_event_type ON mercadopago_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhook_events_status ON mercadopago_webhook_events(status);

-- Add a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on mercadopago_webhook_events
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON mercadopago_webhook_events
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
