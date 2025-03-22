-- Script para atualizar assinaturas pendentes existentes

-- 1. Identificar o usuu00e1rio atual que estu00e1 logado
DO $$
DECLARE
  current_user_id UUID;
  active_subscription RECORD;
  pending_subscription RECORD;
BEGIN
  -- Obter o ID do usuu00e1rio atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuu00e1rio autenticado. Execute este script quando estiver logado.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Atualizando assinaturas para o usuu00e1rio: %', current_user_id;
  
  -- Verificar se existe uma assinatura ativa
  SELECT * INTO active_subscription
  FROM user_plan_subscriptions
  WHERE user_id = current_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Verificar se existe uma assinatura pendente mais recente
  SELECT * INTO pending_subscription
  FROM user_plan_subscriptions
  WHERE user_id = current_user_id
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Cancelar todas as assinaturas pendentes antigas
  IF pending_subscription IS NOT NULL THEN
    RAISE NOTICE 'Assinatura pendente mais recente: % (Plano: %)', 
      pending_subscription.id, pending_subscription.plan_id;
    
    UPDATE user_plan_subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE user_id = current_user_id
      AND status = 'pending'
      AND id != pending_subscription.id;
      
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE 'Canceladas % assinaturas pendentes antigas', row_count;
  ELSE
    RAISE NOTICE 'Nenhuma assinatura pendente encontrada';
  END IF;
  
  -- Verificar e cancelar assinaturas pendentes se existir uma ativa
  IF active_subscription IS NOT NULL THEN
    RAISE NOTICE 'Assinatura ativa encontrada: % (Plano: %)', 
      active_subscription.id, active_subscription.plan_id;
    
    UPDATE user_plan_subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE user_id = current_user_id
      AND status = 'pending';
      
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE 'Canceladas % assinaturas pendentes (usuu00e1rio tem assinatura ativa)', row_count;
  END IF;
  
  -- Criar uma funu00e7u00e3o e trigger para garantir que isso aconteu00e7a automaticamente no futuro
  CREATE OR REPLACE FUNCTION cancel_pending_subscriptions()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Se uma nova assinatura for criada ou uma assinatura for ativada
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status = 'active') THEN
      -- Cancelar todas as outras assinaturas pendentes do mesmo usuu00e1rio
      UPDATE user_plan_subscriptions
      SET status = 'cancelled',
          cancelled_at = NOW(),
          updated_at = NOW()
      WHERE user_id = NEW.user_id
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
  
  RAISE NOTICE 'Trigger de cancelamento automu00e1tico criado com sucesso';
END;
$$;
