-- Script simples para ativar uma assinatura e garantir que o check_active_subscription funcione corretamente

-- 1. Corrigir a funu00e7u00e3o check_active_subscription
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

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.check_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_active_subscription(uuid) TO service_role;

-- 2. Funu00e7u00e3o para ativar uma assinatura e cancelar outras pendentes
CREATE OR REPLACE FUNCTION public.activate_subscription(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_active_subscription_id uuid;
  v_cancelled_count integer;
  v_result jsonb;
BEGIN
  -- Verificar se a assinatura existe
  SELECT user_id INTO v_user_id
  FROM user_plan_subscriptions
  WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Assinatura nu00e3o encontrada'
    );
  END IF;
  
  -- Verificar se o usuu00e1rio ju00e1 tem uma assinatura ativa
  SELECT id INTO v_active_subscription_id
  FROM user_plan_subscriptions
  WHERE user_id = v_user_id
    AND status = 'active'
    AND id != p_subscription_id;
  
  -- Se tiver, cancelar a assinatura ativa atual
  IF v_active_subscription_id IS NOT NULL THEN
    UPDATE user_plan_subscriptions
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = v_active_subscription_id;
    
    v_result := jsonb_build_object(
      'previous_subscription_cancelled', true,
      'previous_subscription_id', v_active_subscription_id
    );
  ELSE
    v_result := jsonb_build_object(
      'no_active_subscription', true
    );
  END IF;
  
  -- Cancelar todas as assinaturas pendentes, exceto a que estu00e1 sendo ativada
  UPDATE user_plan_subscriptions
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE user_id = v_user_id
    AND status = 'pending'
    AND id != p_subscription_id;
  
  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object(
    'pending_subscriptions_cancelled', v_cancelled_count
  );
  
  -- Ativar a assinatura
  UPDATE user_plan_subscriptions
  SET 
    status = 'active',
    payment_status = 'paid',
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  v_result := v_result || jsonb_build_object(
    'subscription_activated', true,
    'subscription_id', p_subscription_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'details', v_result
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.activate_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription(uuid) TO service_role;

-- 3. Testar a ativau00e7u00e3o de uma assinatura
DO $$
DECLARE
  v_user_id uuid := '2ba45899-b5c7-4089-aeac-74dedcb2bfb8'; -- Substitua pelo ID do usuu00e1rio
  v_subscription_id uuid;
  v_result jsonb;
  v_record RECORD;
BEGIN
  -- Obter uma assinatura pendente
  SELECT id INTO v_subscription_id
  FROM user_plan_subscriptions
  WHERE user_id = v_user_id
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_subscription_id IS NULL THEN
    RAISE NOTICE 'Nenhuma assinatura pendente encontrada para o usuu00e1rio';
    RETURN;
  END IF;
  
  -- Ativar a assinatura
  v_result := activate_subscription(v_subscription_id);
  
  -- Exibir o resultado
  RAISE NOTICE 'Resultado da ativau00e7u00e3o: %', v_result;
  
  -- Verificar o estado atual das assinaturas do usuu00e1rio
  RAISE NOTICE 'Estado atual das assinaturas:';
  FOR v_record IN (
    SELECT 
      id, 
      status, 
      payment_status, 
      start_date, 
      end_date
    FROM 
      user_plan_subscriptions
    WHERE 
      user_id = v_user_id
    ORDER BY 
      updated_at DESC
  ) LOOP
    RAISE NOTICE 'ID: %, Status: %, Payment Status: %, Period: % to %', 
      v_record.id, 
      v_record.status, 
      v_record.payment_status, 
      v_record.start_date, 
      v_record.end_date;
  END LOOP;
  
  -- Verificar se o usuu00e1rio tem uma assinatura ativa
  RAISE NOTICE 'O usuu00e1rio tem uma assinatura ativa? %', check_active_subscription(v_user_id);
END;
$$;
