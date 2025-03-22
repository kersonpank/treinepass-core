-- Script para cancelar assinaturas pendentes antigas

-- Cancelar todas as assinaturas pendentes exceto a mais recente para cada usuu00e1rio
WITH latest_pending AS (
  SELECT DISTINCT ON (user_id) id
  FROM user_plan_subscriptions
  WHERE status = 'pending'
  ORDER BY user_id, created_at DESC
)
UPDATE user_plan_subscriptions
SET 
  status = 'cancelled',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE 
  status = 'pending' 
  AND id NOT IN (SELECT id FROM latest_pending);

-- Criar trigger para cancelar assinaturas pendentes antigas automaticamente
CREATE OR REPLACE FUNCTION cancel_pending_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
  -- Se uma nova assinatura for criada ou uma assinatura for ativada
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status = 'active') THEN
    -- Cancelar todas as outras assinaturas pendentes do mesmo usuu00e1rio
    UPDATE user_plan_subscriptions
    SET 
      status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
    WHERE 
      user_id = NEW.user_id
      AND id != NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar ou substituir o trigger
DROP TRIGGER IF EXISTS cancel_pending_subscriptions_trigger ON user_plan_subscriptions;

CREATE TRIGGER cancel_pending_subscriptions_trigger
AFTER INSERT OR UPDATE OF status ON user_plan_subscriptions
FOR EACH ROW
EXECUTE FUNCTION cancel_pending_subscriptions();
