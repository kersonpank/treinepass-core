  -- Script para limpar assinaturas pendentes e garantir que apenas uma esteja ativa

  -- 1. Verificar o estado atual das assinaturas do usuu00e1rio
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
    user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8'
  ORDER BY
    status, updated_at DESC;

  -- 2. Executar a limpeza das assinaturas
  DO $$
  DECLARE
    v_user_id uuid := '2ba45899-b5c7-4089-aeac-74dedcb2bfb8';
    v_active_subscription_id uuid;
    v_pending_count integer;
    v_cancelled_count integer;
  BEGIN
    -- Verificar se o usuu00e1rio tem uma assinatura ativa
    SELECT id INTO v_active_subscription_id
    FROM user_plan_subscriptions
    WHERE user_id = v_user_id
      AND status = 'active'
    LIMIT 1;
    
    -- Se nu00e3o tiver assinatura ativa, ativar a mais recente das pendentes
    IF v_active_subscription_id IS NULL THEN
      SELECT id INTO v_active_subscription_id
      FROM user_plan_subscriptions
      WHERE user_id = v_user_id
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF v_active_subscription_id IS NOT NULL THEN
        RAISE NOTICE 'Ativando a assinatura pendente mais recente: %', v_active_subscription_id;
        
        UPDATE user_plan_subscriptions
        SET 
          status = 'active',
          payment_status = 'paid',
          updated_at = NOW()
        WHERE id = v_active_subscription_id;
      ELSE
        RAISE NOTICE 'Nenhuma assinatura pendente encontrada para ativar';
      END IF;
    ELSE
      RAISE NOTICE 'Usuu00e1rio ju00e1 possui uma assinatura ativa: %', v_active_subscription_id;
    END IF;
    
    -- Cancelar todas as outras assinaturas pendentes
    UPDATE user_plan_subscriptions
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND id != COALESCE(v_active_subscription_id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
    RAISE NOTICE 'Canceladas % assinaturas pendentes', v_cancelled_count;
    
    -- Verificar o estado final
    SELECT COUNT(*) INTO v_pending_count
    FROM user_plan_subscriptions
    WHERE user_id = v_user_id
      AND status = 'pending';
    
    RAISE NOTICE 'Estado final: % assinaturas pendentes restantes', v_pending_count;
    
    -- Verificar se o usuu00e1rio tem uma assinatura ativa
    IF EXISTS (
      SELECT 1 
      FROM user_plan_subscriptions
      WHERE user_id = v_user_id
        AND status = 'active'
    ) THEN
      RAISE NOTICE 'O usuu00e1rio tem uma assinatura ativa';
    ELSE
      RAISE NOTICE 'O usuu00e1rio nu00e3o tem uma assinatura ativa';
    END IF;
  END;
  $$;

  -- 3. Verificar o estado final das assinaturas
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
    user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8'
  ORDER BY
    status, updated_at DESC;

  -- 4. Testar a funu00e7u00e3o check_active_subscription
  SELECT check_active_subscription('2ba45899-b5c7-4089-aeac-74dedcb2bfb8') AS has_active_subscription;
