-- Script para corrigir a função validate_check_in_rules para verificar corretamente planos ativos

-- Primeiro, vamos verificar a definição atual da função
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_check_in_rules';

-- Agora vamos atualizar a função para verificar corretamente os planos ativos
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
  p_num_checkins integer
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
  -- Verificar se o usuário tem uma assinatura ativa
  SELECT s.id, p.monthly_cost, p.id as plan_id
  INTO v_active_subscription
  FROM user_plan_subscriptions s
  JOIN benefit_plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
  AND s.status = 'active'
  AND s.payment_status = 'paid'
  LIMIT 1;
  
  -- Se não tiver assinatura ativa, retornar false
  IF v_active_subscription IS NULL THEN
    RETURN QUERY
    SELECT 
      false,
      'Você não possui um plano ativo. Por favor, assine um plano para continuar.',
      0::numeric,
      NULL::uuid,
      0::numeric,
      0;
    RETURN;
  END IF;
  
  -- Verificar se a academia existe
  IF NOT EXISTS (SELECT 1 FROM academias WHERE id = p_academia_id) THEN
    RETURN QUERY
    SELECT 
      false,
      'Academia não encontrada.',
      0::numeric,
      NULL::uuid,
      0::numeric,
      0;
    RETURN;
  END IF;
  
  -- Calcular valor de repasse (lógica simplificada)
  v_valor_repasse := COALESCE((SELECT valor_repasse_checkin FROM academias WHERE id = p_academia_id), 0);
  v_valor_plano := v_active_subscription.monthly_cost;
  
  -- Verificar limite de check-ins (se aplicável)
  v_check_in_count := (
    SELECT COUNT(*)
    FROM gym_check_ins
    WHERE user_id = p_user_id
    AND academia_id = p_academia_id
    AND DATE_TRUNC('day', check_in_time) = DATE_TRUNC('day', NOW())
  );
  
  v_max_check_ins := 1; -- Valor padrão, pode ser ajustado conforme regras do plano
  
  IF v_check_in_count >= v_max_check_ins THEN
    RETURN QUERY
    SELECT 
      false,
      'Você já atingiu o limite de check-ins para hoje nesta academia.',
      v_valor_repasse,
      v_active_subscription.plan_id,
      v_valor_plano,
      v_check_in_count;
    RETURN;
  END IF;
  
  -- Se passou por todas as verificações, pode fazer check-in
  RETURN QUERY
  SELECT 
    true,
    'Check-in permitido.',
    v_valor_repasse,
    v_active_subscription.plan_id,
    v_valor_plano,
    v_check_in_count;
END;
$$;

-- Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.validate_check_in_rules(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_check_in_rules(uuid, uuid) TO service_role;

-- Verificar se há alguma política RLS que possa estar bloqueando o acesso às tabelas utilizadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename IN ('user_plan_subscriptions', 'benefit_plans', 'gym_check_ins', 'academias');
