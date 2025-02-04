-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'cancelled')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed'))
);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION check_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM subscriptions s
    WHERE s.user_id = p_user_id
    AND s.status = 'active'
    AND s.payment_status = 'paid'
    AND NOW() BETWEEN s.start_date AND s.end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update check_in_codes table to validate subscription
ALTER TABLE check_in_codes ADD COLUMN IF NOT EXISTS subscription_validated BOOLEAN DEFAULT FALSE;

-- Update validate_check_in_code function to check subscription
CREATE OR REPLACE FUNCTION validate_check_in_code(p_code TEXT, p_academia_id UUID)
RETURNS TABLE (
  id UUID,
  is_valid BOOLEAN,
  message TEXT,
  user_id UUID,
  user_name TEXT
) AS $$
DECLARE
  v_check_in_code RECORD;
  v_has_subscription BOOLEAN;
BEGIN
  -- Get check-in code
  SELECT c.*, p.full_name
  INTO v_check_in_code
  FROM check_in_codes c
  JOIN user_profiles p ON p.user_id = c.user_id
  WHERE c.code = p_code
  AND c.academia_id = p_academia_id
  AND c.status = 'active'
  LIMIT 1;

  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      FALSE,
      'Código inválido ou não encontrado.'::TEXT,
      NULL::UUID,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Check if code is expired
  IF v_check_in_code.expires_at < NOW() THEN
    UPDATE check_in_codes
    SET status = 'expired'
    WHERE id = v_check_in_code.id;

    RETURN QUERY SELECT 
      v_check_in_code.id,
      FALSE,
      'Código expirado.'::TEXT,
      v_check_in_code.user_id,
      v_check_in_code.full_name;
    RETURN;
  END IF;

  -- Check if user has active subscription
  SELECT check_active_subscription(v_check_in_code.user_id)
  INTO v_has_subscription;

  IF NOT v_has_subscription THEN
    RETURN QUERY SELECT 
      v_check_in_code.id,
      FALSE,
      'Usuário não possui plano ativo.'::TEXT,
      v_check_in_code.user_id,
      v_check_in_code.full_name;
    RETURN;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT 
    v_check_in_code.id,
    TRUE,
    'Código válido.'::TEXT,
    v_check_in_code.user_id,
    v_check_in_code.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
