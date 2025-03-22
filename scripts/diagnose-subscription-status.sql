-- Script para diagnosticar o status das assinaturas e funções relacionadas

-- 1. Verificar a estrutura da tabela user_plan_subscriptions
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'user_plan_subscriptions'
ORDER BY 
  ordinal_position;

-- 2. Verificar a definição atual da função check_active_subscription
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'check_active_subscription';

-- 3. Verificar a definição atual da função validate_check_in_rules
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_check_in_rules';

-- 4. Verificar as assinaturas do usuário
SELECT 
  id, 
  user_id, 
  plan_id, 
  status, 
  payment_status, 
  start_date, 
  end_date,
  NOW() BETWEEN start_date AND end_date AS is_within_date_range,
  created_at,
  updated_at
FROM 
  user_plan_subscriptions
WHERE 
  user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8';

-- 5. Verificar se o usuário tem assinatura ativa segundo a função
SELECT check_active_subscription('2ba45899-b5c7-4089-aeac-74dedcb2bfb8') AS has_active_subscription;

-- 6. Verificar os últimos eventos de webhook processados
SELECT 
  id, 
  event_id, 
  event_type, 
  payment_id, 
  subscription_id, 
  processed, 
  processed_at, 
  error_message,
  created_at
FROM 
  asaas_webhook_events
ORDER BY 
  created_at DESC
LIMIT 10;

-- 7. Verificar se há alguma política RLS que possa estar bloqueando o acesso às tabelas
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

-- 8. Verificar se há triggers na tabela user_plan_subscriptions
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM 
  information_schema.triggers
WHERE 
  event_object_table = 'user_plan_subscriptions';

-- 9. Verificar os planos disponíveis
SELECT 
  id, 
  name, 
  monthly_cost, 
  created_at, 
  updated_at
FROM 
  benefit_plans
WHERE 
  id IN (SELECT DISTINCT plan_id FROM user_plan_subscriptions WHERE user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8');
