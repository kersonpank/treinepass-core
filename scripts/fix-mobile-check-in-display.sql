-- Script para corrigir a exibiu00e7u00e3o do token de acesso no aplicativo mu00f3vel

-- 1. Verificar a estrutura atual das tabelas relacionadas ao check-in
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND 
      table_name IN ('gym_check_ins', 'check_in_codes', 'gym_qr_codes');

-- 2. Verificar a estrutura da tabela check_in_codes (se existir)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'check_in_codes';

-- 3. Criar ou substituir a funu00e7u00e3o para gerar tokens de acesso para o aplicativo mu00f3vel
CREATE OR REPLACE FUNCTION public.generate_mobile_access_token(
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
  -- Primeiro validar se o usuu00e1rio pode fazer check-in
  SELECT * FROM validate_check_in_rules(p_user_id, p_academia_id) INTO v_validation_result;
  
  IF NOT v_validation_result.can_check_in THEN
    RETURN QUERY SELECT 
      NULL::VARCHAR AS access_token,
      NULL::TIMESTAMPTZ AS expires_at,
      v_validation_result.can_check_in,
      v_validation_result.message;
    RETURN;
  END IF;
  
  -- Gerar token alfanumu00e9rico aleatu00f3rio (6 caracteres)
  v_token := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  v_expires_at := NOW() + INTERVAL '15 minutes';
  
  -- Verificar se ju00e1 existe um token ativo para este usuu00e1rio e academia
  UPDATE gym_check_ins
  SET status = 'expired'
  WHERE 
    user_id = p_user_id AND 
    academia_id = p_academia_id AND 
    status = 'active' AND
    validation_method = 'access_token';
    
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
  
  -- Retornar o token e informau00e7u00f5es de expirau00e7u00e3o
  RETURN QUERY SELECT 
    v_token AS access_token,
    v_expires_at AS expires_at,
    TRUE AS can_check_in,
    'Token de acesso gerado com sucesso. Apresente este cu00f3digo na academia.' AS message;
END;
$$;

-- 4. Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.generate_mobile_access_token(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_mobile_access_token(UUID, UUID) TO service_role;

-- 5. Criar ou substituir a funu00e7u00e3o para obter o token ativo de um usuu00e1rio
CREATE OR REPLACE FUNCTION public.get_active_access_token(
  p_user_id UUID,
  p_academia_id UUID
) RETURNS TABLE (
  access_token VARCHAR,
  expires_at TIMESTAMPTZ,
  seconds_remaining INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    c.access_token,
    c.token_expires_at,
    EXTRACT(EPOCH FROM (c.token_expires_at - NOW()))::INTEGER AS seconds_remaining
  FROM gym_check_ins c
  WHERE 
    c.user_id = p_user_id AND
    c.academia_id = p_academia_id AND
    c.status = 'active' AND
    c.validation_method = 'access_token' AND
    c.token_expires_at > NOW()
  ORDER BY c.token_expires_at DESC
  LIMIT 1;
  
  -- Se nu00e3o encontrar nenhum token ativo, retorna vazio
END;
$$;

-- 6. Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.get_active_access_token(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_access_token(UUID, UUID) TO service_role;
