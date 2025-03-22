-- Script para corrigir a função check_active_subscription para usar a tabela user_plan_subscriptions

-- Primeiro, vamos verificar se a função existe
SELECT EXISTS (
  SELECT 1 
  FROM pg_proc 
  WHERE proname = 'check_active_subscription'
) AS function_exists;

-- Criar ou substituir a função check_active_subscription
CREATE OR REPLACE FUNCTION public.check_active_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_plan_subscriptions s
    WHERE s.user_id = p_user_id
    AND s.status = 'active'
    AND s.payment_status = 'paid'
    AND NOW() BETWEEN s.start_date AND s.end_date
  );
END;
$$;

-- Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.check_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_active_subscription(uuid) TO service_role;

-- Verificar se a função validate_check_in_rules está usando a função check_active_subscription
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_check_in_rules';

-- Testar a função com um usuário específico
SELECT check_active_subscription('2ba45899-b5c7-4089-aeac-74dedcb2bfb8') AS has_active_subscription;

-- Verificar os registros de assinatura do usuário para debug
SELECT 
  id, 
  user_id, 
  plan_id, 
  status, 
  payment_status, 
  start_date, 
  end_date,
  NOW() BETWEEN start_date AND end_date AS is_within_date_range
FROM 
  user_plan_subscriptions
WHERE 
  user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8';
