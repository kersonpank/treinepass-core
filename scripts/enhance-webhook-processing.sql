-- Script para melhorar o processamento de webhooks seguindo as regras de negu00f3cio:
-- 1. Um usuu00e1rio su00f3 pode ter uma assinatura ativa por vez
-- 2. Quando uma nova assinatura u00e9 ativada, todas as pendentes devem ser canceladas
-- 3. Suporte a upgrade de planos com abatimento de valor

-- Primeiro, vamos garantir que a funu00e7u00e3o check_active_subscription esteja correta
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

-- Criar uma funu00e7u00e3o para lidar com a ativau00e7u00e3o de assinaturas seguindo as regras de negu00f3cio
CREATE OR REPLACE FUNCTION public.handle_subscription_activation(
  p_user_id uuid,
  p_subscription_id uuid,
  p_is_upgrade boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_active_subscription RECORD;
  v_new_subscription RECORD;
  v_active_plan RECORD;
  v_new_plan RECORD;
  v_days_remaining integer;
  v_prorated_value numeric;
  v_upgrade_discount numeric := 0;
BEGIN
  -- Obter informau00e7u00f5es sobre a nova assinatura
  SELECT s.*, p.monthly_cost, p.name as plan_name
  INTO v_new_subscription
  FROM user_plan_subscriptions s
  JOIN benefit_plans p ON s.plan_id = p.id
  WHERE s.id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Assinatura nu00e3o encontrada'
    );
  END IF;
  
  -- Verificar se o usuu00e1rio ju00e1 tem uma assinatura ativa
  SELECT s.*, p.monthly_cost, p.name as plan_name, 
         EXTRACT(DAY FROM (s.end_date - CURRENT_DATE)) as days_remaining
  INTO v_active_subscription
  FROM user_plan_subscriptions s
  JOIN benefit_plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
    AND s.id != p_subscription_id
  ORDER BY s.end_date DESC
  LIMIT 1;
  
  -- Se for um upgrade e o usuu00e1rio tiver uma assinatura ativa
  IF p_is_upgrade AND v_active_subscription.id IS NOT NULL THEN
    -- Verificar se o novo plano tem valor maior que o atual
    IF v_new_subscription.monthly_cost <= v_active_subscription.monthly_cost THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Para fazer upgrade, o novo plano deve ter valor maior que o atual'
      );
    END IF;
    
    -- Calcular o valor proporcional restante da assinatura atual
    v_days_remaining := v_active_subscription.days_remaining;
    IF v_days_remaining > 0 THEN
      v_prorated_value := (v_active_subscription.monthly_cost / 30) * v_days_remaining;
      v_upgrade_discount := v_prorated_value;
    END IF;
    
    -- Cancelar a assinatura ativa atual
    UPDATE user_plan_subscriptions
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = v_active_subscription.id;
    
    -- Registrar o desconto do upgrade para uso futuro (poderia ser salvo em uma tabela)
    v_result := jsonb_build_object(
      'previous_subscription_cancelled', true,
      'previous_subscription_id', v_active_subscription.id,
      'previous_plan', v_active_subscription.plan_name,
      'days_remaining', v_days_remaining,
      'prorated_value', v_prorated_value,
      'upgrade_discount', v_upgrade_discount
    );
  ELSIF v_active_subscription.id IS NOT NULL THEN
    -- Se nu00e3o for upgrade mas tiver assinatura ativa, verificar se a atual expirou
    IF v_active_subscription.end_date >= CURRENT_DATE THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Usuu00e1rio possui uma assinatura ativa que ainda nu00e3o expirou',
        'current_subscription', jsonb_build_object(
          'id', v_active_subscription.id,
          'plan', v_active_subscription.plan_name,
          'end_date', v_active_subscription.end_date,
          'days_remaining', v_active_subscription.days_remaining
        )
      );
    ELSE
      -- Se a assinatura atual expirou, cancelu00e1-la
      UPDATE user_plan_subscriptions
      SET 
        status = 'expired',
        updated_at = NOW()
      WHERE id = v_active_subscription.id;
      
      v_result := jsonb_build_object(
        'previous_subscription_expired', true,
        'previous_subscription_id', v_active_subscription.id
      );
    END IF;
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
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND id != p_subscription_id;
  
  GET DIAGNOSTICS v_days_remaining = ROW_COUNT;
  v_result := v_result || jsonb_build_object(
    'pending_subscriptions_cancelled', v_days_remaining
  );
  
  -- Ativar a nova assinatura
  UPDATE user_plan_subscriptions
  SET 
    status = 'active',
    payment_status = 'paid',
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  v_result := v_result || jsonb_build_object(
    'subscription_activated', true,
    'subscription_id', p_subscription_id,
    'plan', v_new_subscription.plan_name
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
GRANT EXECUTE ON FUNCTION public.handle_subscription_activation(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_subscription_activation(uuid, uuid, boolean) TO service_role;

-- Modificar a funu00e7u00e3o process_asaas_webhook para usar a nova lu00f3gica
-- Nota: Esta u00e9 uma versão simplificada para demonstrau00e7u00e3o. A funu00e7u00e3o real u00e9 mais complexa.
CREATE OR REPLACE FUNCTION public.enhanced_process_payment_webhook(
  payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_type TEXT;
  payment_data JSONB;
  payment_id TEXT;
  payment_status TEXT;
  subscription_id TEXT;
  external_reference TEXT;
  user_id UUID;
  subscription_record RECORD;
  result JSONB;
  is_upgrade BOOLEAN := false;
BEGIN
  -- Extrair tipo de evento e dados
  event_type := payload->>'event';
  payment_data := payload->'payment';
  
  -- Verificar se u00e9 um evento de pagamento
  IF event_type LIKE 'PAYMENT_%' AND payment_data IS NOT NULL THEN
    payment_id := payment_data->>'id';
    payment_status := payment_data->>'status';
    subscription_id := payment_data->>'subscription';
    external_reference := payment_data->>'externalReference';
    
    -- Verificar se u00e9 um pagamento confirmado
    IF payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN
      -- Tentar encontrar a assinatura pelo external_reference
      IF external_reference IS NOT NULL THEN
        BEGIN
          -- Verificar se u00e9 um upgrade baseado em metadados (simplificado)
          is_upgrade := COALESCE((payment_data->'metadata'->>'is_upgrade')::boolean, false);
          
          -- Obter o user_id da assinatura
          SELECT user_id INTO user_id
          FROM user_plan_subscriptions
          WHERE id = external_reference::UUID;
          
          IF FOUND THEN
            -- Usar a funu00e7u00e3o de ativau00e7u00e3o de assinatura
            result := handle_subscription_activation(user_id, external_reference::UUID, is_upgrade);
          ELSE
            result := jsonb_build_object(
              'success', false,
              'message', 'Assinatura nu00e3o encontrada pelo external_reference'
            );
          END IF;
        EXCEPTION WHEN OTHERS THEN
          result := jsonb_build_object(
            'success', false,
            'error', 'Erro ao processar pagamento: ' || SQLERRM
          );
        END;
      ELSE
        result := jsonb_build_object(
          'success', false,
          'message', 'External reference nu00e3o fornecido no webhook'
        );
      END IF;
    ELSIF payment_status = 'OVERDUE' THEN
      -- Lu00f3gica para pagamento em atraso
      -- ...
      result := jsonb_build_object(
        'success', true,
        'message', 'Pagamento em atraso processado'
      );
    ELSIF payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN
      -- Lu00f3gica para pagamento reembolsado ou excluído
      -- ...
      result := jsonb_build_object(
        'success', true,
        'message', 'Pagamento reembolsado/excluído processado'
      );
    ELSE
      result := jsonb_build_object(
        'success', true,
        'message', 'Status de pagamento nu00e3o requer processamento especial: ' || payment_status
      );
    END IF;
  ELSE
    result := jsonb_build_object(
      'success', true,
      'message', 'Evento nu00e3o u00e9 de pagamento ou nu00e3o contu00e9m dados de pagamento'
    );
  END IF;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro inesperado: ' || SQLERRM
  );
END;
$$;

-- Testar a ativau00e7u00e3o de uma assinatura
DO $$
DECLARE
  v_user_id uuid := '2ba45899-b5c7-4089-aeac-74dedcb2bfb8';
  v_subscription_id uuid;
  v_result jsonb;
  v_subscription RECORD;
BEGIN
  -- Obter uma assinatura pendente
  SELECT id INTO v_subscription_id
  FROM user_plan_subscriptions
  WHERE user_id = v_user_id
    AND status = 'pending'
  LIMIT 1;
  
  IF v_subscription_id IS NULL THEN
    RAISE NOTICE 'Nenhuma assinatura pendente encontrada para o usuu00e1rio';
    RETURN;
  END IF;
  
  -- Ativar a assinatura
  v_result := handle_subscription_activation(v_user_id, v_subscription_id, false);
  
  -- Exibir o resultado
  RAISE NOTICE 'Resultado da ativau00e7u00e3o: %', v_result;
  
  -- Verificar o estado atual das assinaturas
  RAISE NOTICE 'Estado atual das assinaturas:';
  FOR v_subscription IN (
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
      v_subscription.id, 
      v_subscription.status, 
      v_subscription.payment_status, 
      v_subscription.start_date, 
      v_subscription.end_date;
  END LOOP;
  
  -- Verificar se o usuu00e1rio tem uma assinatura ativa
  RAISE NOTICE 'O usuu00e1rio tem uma assinatura ativa? %', check_active_subscription(v_user_id);
END;
$$;
