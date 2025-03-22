-- Script para corrigir a exibição e validação de tokens de check-in

-- 1. Verificar a estrutura atual da tabela gym_check_ins
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gym_check_ins';

-- 2. Verificar se a coluna access_token existe, se não, adicioná-la
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'gym_check_ins' AND column_name = 'access_token') THEN
    ALTER TABLE gym_check_ins ADD COLUMN access_token VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'gym_check_ins' AND column_name = 'token_expires_at') THEN
    ALTER TABLE gym_check_ins ADD COLUMN token_expires_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'gym_check_ins' AND column_name = 'validation_method') THEN
    ALTER TABLE gym_check_ins ADD COLUMN validation_method VARCHAR(20) DEFAULT 'qr_code';
  END IF;
END $$;

-- 3. Criar ou substituir a função para gerar tokens de acesso para check-in
CREATE OR REPLACE FUNCTION public.generate_check_in_token(
  p_user_id UUID,
  p_academia_id UUID
) RETURNS TABLE (
  access_token VARCHAR,
  expires_at TIMESTAMPTZ,
  can_check_in BOOLEAN,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token VARCHAR(10);
  v_expires_at TIMESTAMPTZ;
  v_validation_result RECORD;
  v_check_in_id UUID;
BEGIN
  -- Primeiro validar se o usuário pode fazer check-in
  SELECT * FROM validate_check_in_rules(p_user_id, p_academia_id) INTO v_validation_result;
  
  IF NOT v_validation_result.can_check_in THEN
    RETURN QUERY SELECT 
      NULL::VARCHAR AS access_token,
      NULL::TIMESTAMPTZ AS expires_at,
      v_validation_result.can_check_in,
      v_validation_result.message;
    RETURN;
  END IF;
  
  -- Gerar token alfanumérico aleatório (6 caracteres)
  v_token := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  v_expires_at := NOW() + INTERVAL '15 minutes';
  
  -- Inserir o check-in com status 'active' (pronto para ser usado)
  INSERT INTO gym_check_ins (
    user_id,
    academia_id,
    status,
    access_token,
    token_expires_at,
    validation_method,
    plano_id,
    valor_repasse,
    valor_plano
  ) VALUES (
    p_user_id,
    p_academia_id,
    'active',
    v_token,
    v_expires_at,
    'access_token',
    v_validation_result.plano_id,
    v_validation_result.valor_repasse,
    v_validation_result.valor_plano
  ) RETURNING id INTO v_check_in_id;
  
  -- Retornar o token e informações de expiração
  RETURN QUERY SELECT 
    v_token AS access_token,
    v_expires_at AS expires_at,
    TRUE AS can_check_in,
    'Token de acesso gerado com sucesso. Apresente este código na academia.' AS message;
END;
$$;

-- 4. Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.generate_check_in_token(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_check_in_token(UUID, UUID) TO service_role;

-- 5. Criar ou substituir a função para validar tokens de acesso
CREATE OR REPLACE FUNCTION public.validate_access_token(
  p_token VARCHAR,
  p_academia_id UUID
) RETURNS TABLE (
  valid BOOLEAN,
  message TEXT,
  user_id UUID,
  user_name TEXT,
  check_in_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_check_in RECORD;
BEGIN
  -- Buscar o check-in com o token fornecido
  SELECT 
    c.id,
    c.user_id,
    p.full_name,
    c.status
  INTO v_check_in
  FROM gym_check_ins c
  JOIN user_profiles p ON c.user_id = p.user_id
  WHERE 
    c.access_token = UPPER(p_token)
    AND c.academia_id = p_academia_id
    AND c.token_expires_at > NOW()
    AND c.status = 'active';
  
  IF v_check_in IS NULL THEN
    RETURN QUERY SELECT 
      FALSE,
      'Token inválido ou expirado',
      NULL::UUID,
      NULL::TEXT,
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Atualizar o status do check-in para 'used'
  UPDATE gym_check_ins
  SET 
    status = 'used',
    check_in_time = NOW(),
    validated_at = NOW()
  WHERE id = v_check_in.id;
  
  -- Retornar informações de validação
  RETURN QUERY SELECT 
    TRUE,
    'Check-in validado com sucesso',
    v_check_in.user_id,
    v_check_in.full_name,
    v_check_in.id;
END;
$$;

-- 6. Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.validate_access_token(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_access_token(VARCHAR, UUID) TO service_role;
