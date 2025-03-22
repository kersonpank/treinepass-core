-- Script para corrigir a funu00e7u00e3o validate_check_in_rules para verificar corretamente planos ativos

-- Primeiro, vamos verificar a definiu00e7u00e3o atual da funu00e7u00e3o
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_check_in_rules';

-- Verificar a estrutura atual da tabela de retorno
SELECT * FROM validate_check_in_rules('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') LIMIT 0;

-- Remover a funu00e7u00e3o existente
DROP FUNCTION IF EXISTS public.validate_check_in_rules(uuid, uuid);

-- Agora vamos criar a nova funu00e7u00e3o com a mesma estrutura de retorno
CREATE OR REPLACE FUNCTION public.validate_check_in_rules(
  p_user_id uuid,
  p_academia_id uuid
) 
RETURNS TABLE(
  can_check_in boolean,
  message text,
  valor_repasse numeric,
  plano_id uuid,
  valor_plano numeric,
  p_num_checkins integer,
  remaining_daily integer,
  remaining_weekly integer,
  remaining_monthly integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_subscription RECORD;
  v_check_in_count INTEGER;
  v_max_check_ins INTEGER;
  v_valor_repasse NUMERIC;
  v_valor_plano NUMERIC;
BEGIN
  -- Verificar se o usuu00e1rio tem uma assinatura ativa
  SELECT s.id, p.monthly_cost, p.id as plan_id
  INTO v_active_subscription
  FROM user_plan_subscriptions s
  JOIN benefit_plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
  AND s.status = 'active'
  AND s.payment_status = 'paid'
  LIMIT 1;
  
  -- Se nu00e3o tiver assinatura ativa, retornar false
  IF v_active_subscription IS NULL THEN
    RETURN QUERY
    SELECT 
      false,
      'Vocu00ea nu00e3o possui um plano ativo. Por favor, assine um plano para continuar.',
      0::numeric,
      NULL::uuid,
      0::numeric,
      0,
      0,
      0,
      0;
    RETURN;
  END IF;
  
  -- Verificar se a academia existe
  IF NOT EXISTS (SELECT 1 FROM academias WHERE id = p_academia_id) THEN
    RETURN QUERY
    SELECT 
      false,
      'Academia nu00e3o encontrada.',
      0::numeric,
      NULL::uuid,
      0::numeric,
      0,
      0,
      0,
      0;
    RETURN;
  END IF;
  
  -- Calcular valor de repasse (lu00f3gica simplificada)
  v_valor_repasse := COALESCE((SELECT valor_repasse_checkin FROM academias WHERE id = p_academia_id), 0);
  v_valor_plano := v_active_subscription.monthly_cost;
  
  -- Verificar limite de check-ins (se aplicu00e1vel)
  v_check_in_count := (
    SELECT COUNT(*)
    FROM gym_check_ins
    WHERE user_id = p_user_id
    AND academia_id = p_academia_id
    AND DATE_TRUNC('day', check_in_time) = DATE_TRUNC('day', NOW())
  );
  
  v_max_check_ins := 1; -- Valor padru00e3o, pode ser ajustado conforme regras do plano
  
  IF v_check_in_count >= v_max_check_ins THEN
    RETURN QUERY
    SELECT 
      false,
      'Vocu00ea ju00e1 atingiu o limite de check-ins para hoje nesta academia.',
      v_valor_repasse,
      v_active_subscription.plan_id,
      v_valor_plano,
      v_check_in_count,
      0,
      0,
      0;
    RETURN;
  END IF;
  
  -- Se passou por todas as verificau00e7u00f5es, pode fazer check-in
  RETURN QUERY
  SELECT 
    true,
    'Check-in permitido.',
    v_valor_repasse,
    v_active_subscription.plan_id,
    v_valor_plano,
    v_check_in_count,
    1, -- remaining_daily (simplificado)
    7, -- remaining_weekly (simplificado)
    30; -- remaining_monthly (simplificado)
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.validate_check_in_rules(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_check_in_rules(uuid, uuid) TO service_role;
