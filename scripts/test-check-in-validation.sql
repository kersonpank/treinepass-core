-- Script para testar a validau00e7u00e3o de check-in

-- Verificar a estrutura atual da funu00e7u00e3o validate_check_in_rules
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_check_in_rules';

-- Verificar usuu00e1rios com planos ativos
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  s.id as subscription_id,
  s.status,
  s.payment_status,
  bp.name as plan_name
FROM 
  auth.users u
JOIN 
  user_profiles p ON u.id = p.user_id
JOIN 
  user_plan_subscriptions s ON u.id = s.user_id
JOIN 
  benefit_plans bp ON s.plan_id = bp.id
WHERE 
  s.status = 'active' AND s.payment_status = 'paid'
LIMIT 5;

-- Selecionar um usuu00e1rio com plano ativo para teste
WITH active_user AS (
  SELECT 
    u.id as user_id
  FROM 
    auth.users u
  JOIN 
    user_plan_subscriptions s ON u.id = s.user_id
  WHERE 
    s.status = 'active' AND s.payment_status = 'paid'
  LIMIT 1
)
-- Selecionar uma academia para teste
, test_gym AS (
  SELECT id as gym_id FROM academias LIMIT 1
)
-- Testar a funu00e7u00e3o validate_check_in_rules
SELECT 
  validate_check_in_rules(au.user_id, tg.gym_id) as validation_result
FROM 
  active_user au, test_gym tg;

-- Testar a funu00e7u00e3o validate_check_in_rules com um usuu00e1rio sem plano ativo
WITH inactive_user AS (
  SELECT 
    u.id as user_id
  FROM 
    auth.users u
  LEFT JOIN 
    user_plan_subscriptions s ON u.id = s.user_id AND s.status = 'active' AND s.payment_status = 'paid'
  WHERE 
    s.id IS NULL
  LIMIT 1
)
-- Selecionar uma academia para teste
, test_gym AS (
  SELECT id as gym_id FROM academias LIMIT 1
)
-- Testar a funu00e7u00e3o validate_check_in_rules
SELECT 
  validate_check_in_rules(iu.user_id, tg.gym_id) as validation_result
FROM 
  inactive_user iu, test_gym tg;
