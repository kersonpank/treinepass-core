-- Script para atualizar as assinaturas pendentes para ativas

-- Verificar as assinaturas pendentes do usuu00e1rio
SELECT 
  id, 
  user_id, 
  plan_id, 
  status, 
  payment_status, 
  start_date, 
  end_date
FROM 
  user_plan_subscriptions
WHERE 
  user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8'
  AND status = 'pending';

-- Atualizar as assinaturas pendentes para ativas
UPDATE user_plan_subscriptions
SET 
  status = 'active',
  payment_status = 'paid',
  updated_at = NOW()
WHERE 
  user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8'
  AND status = 'pending'
  AND payment_status = 'pending';

-- Verificar as assinaturas apu00f3s a atualizau00e7u00e3o
SELECT 
  id, 
  user_id, 
  plan_id, 
  status, 
  payment_status, 
  start_date, 
  end_date
FROM 
  user_plan_subscriptions
WHERE 
  user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8';

-- Testar a funu00e7u00e3o check_active_subscription apu00f3s a atualizau00e7u00e3o
SELECT check_active_subscription('2ba45899-b5c7-4089-aeac-74dedcb2bfb8') AS has_active_subscription;

-- Testar a funu00e7u00e3o validate_check_in_rules apu00f3s a atualizau00e7u00e3o
-- Substitua o UUID da academia por um vu00e1lido do seu sistema
SELECT * FROM validate_check_in_rules('2ba45899-b5c7-4089-aeac-74dedcb2bfb8', '00000000-0000-0000-0000-000000000000');
