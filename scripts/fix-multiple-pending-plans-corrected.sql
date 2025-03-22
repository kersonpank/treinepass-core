-- Script para verificar e corrigir mu00faltiplos planos pendentes para um usuu00e1rio

-- Verifica se hu00e1 usuu00e1rios com mu00faltiplos planos ativos
SELECT 
  user_id,
  COUNT(*) as total_active_plans,
  STRING_AGG(id::text, ', ') as subscription_ids
FROM 
  user_plan_subscriptions
WHERE 
  status = 'active'
GROUP BY 
  user_id
HAVING 
  COUNT(*) > 1;

-- Verifica se hu00e1 usuu00e1rios com planos pendentes e ativos simultaneamente
SELECT 
  ups.user_id,
  up.full_name,
  COUNT(*) FILTER (WHERE ups.status = 'active') as active_plans,
  COUNT(*) FILTER (WHERE ups.status = 'pending') as pending_plans,
  STRING_AGG(ups.id::text || ' (' || ups.status || ')', ', ') as subscription_details
FROM 
  user_plan_subscriptions ups
JOIN
  user_profiles up ON ups.user_id = up.id
WHERE 
  ups.status IN ('active', 'pending')
GROUP BY 
  ups.user_id, up.full_name
HAVING 
  COUNT(*) > 1;

-- Verificar os valores permitidos para o enum de status
SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM
  pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
WHERE
  t.typname = 'plan_subscription_status'
ORDER BY
  e.enumsortorder;

-- Funu00e7u00e3o para atualizar o status de planos pendentes quando um plano ativo existe
-- Usando 'cancelled' em vez de 'historical' (que nu00e3o existe no enum)
CREATE OR REPLACE FUNCTION public.update_pending_plans_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualiza planos pendentes para cancelled quando existe um plano ativo para o mesmo usuu00e1rio
  UPDATE user_plan_subscriptions ups_pending
  SET status = 'cancelled'
  WHERE ups_pending.status = 'pending'
  AND EXISTS (
    SELECT 1 
    FROM user_plan_subscriptions ups_active
    WHERE ups_active.user_id = ups_pending.user_id
    AND ups_active.status = 'active'
    AND ups_active.payment_status = 'paid'
  );
  
  -- Log da atualizau00e7u00e3o
  RAISE NOTICE 'Planos pendentes atualizados para cancelled quando o usuu00e1rio ju00e1 possui um plano ativo';
END;
$$;

-- Trigger para atualizar automaticamente planos pendentes quando um plano se torna ativo
CREATE OR REPLACE FUNCTION public.update_pending_plans_on_active_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se um plano se tornou ativo, atualiza outros planos pendentes para cancelled
  IF NEW.status = 'active' AND NEW.payment_status = 'paid' THEN
    UPDATE user_plan_subscriptions
    SET status = 'cancelled'
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Cria o trigger na tabela de assinaturas
DROP TRIGGER IF EXISTS update_pending_plans_trigger ON user_plan_subscriptions;
CREATE TRIGGER update_pending_plans_trigger
AFTER UPDATE ON user_plan_subscriptions
FOR EACH ROW
WHEN (OLD.status != 'active' AND NEW.status = 'active')
EXECUTE FUNCTION public.update_pending_plans_on_active_trigger();

-- Executa a funu00e7u00e3o para atualizar planos pendentes existentes
SELECT public.update_pending_plans_status();
