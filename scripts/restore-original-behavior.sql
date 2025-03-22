-- Script para restaurar o comportamento original e adicionar apenas a funcionalidade de liberar acesso

-- 1. Restaurar a funu00e7u00e3o check_active_subscription para o comportamento original
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
    AND NOW() BETWEEN s.start_date AND s.end_date
  );
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.check_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_active_subscription(uuid) TO service_role;

-- 2. Criar uma funu00e7u00e3o para processar webhooks de pagamento que atualize o status da assinatura
CREATE OR REPLACE FUNCTION public.process_payment_webhook(payment_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id uuid;
  v_payment_status text;
  v_result jsonb;
BEGIN
  -- Extrair o ID da assinatura do campo externalReference
  v_subscription_id := payment_data->>'externalReference';
  
  -- Se nu00e3o houver ID de assinatura, retornar erro
  IF v_subscription_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'ID de assinatura nu00e3o encontrado no webhook'
    );
  END IF;
  
  -- Mapear o status de pagamento do Asaas para nosso status interno
  CASE payment_data->>'status'
    WHEN 'CONFIRMED' THEN v_payment_status := 'paid';
    WHEN 'RECEIVED' THEN v_payment_status := 'paid';
    WHEN 'OVERDUE' THEN v_payment_status := 'overdue';
    WHEN 'PENDING' THEN v_payment_status := 'pending';
    WHEN 'REFUNDED' THEN v_payment_status := 'refunded';
    WHEN 'REFUND_REQUESTED' THEN v_payment_status := 'refund_requested';
    WHEN 'CHARGEBACK_REQUESTED' THEN v_payment_status := 'chargeback_requested';
    WHEN 'CHARGEBACK_DISPUTE' THEN v_payment_status := 'chargeback_dispute';
    WHEN 'AWAITING_CHARGEBACK_REVERSAL' THEN v_payment_status := 'awaiting_chargeback_reversal';
    WHEN 'DUNNING_REQUESTED' THEN v_payment_status := 'dunning_requested';
    WHEN 'DUNNING_RECEIVED' THEN v_payment_status := 'dunning_received';
    WHEN 'AWAITING_RISK_ANALYSIS' THEN v_payment_status := 'awaiting_risk_analysis';
    ELSE v_payment_status := 'unknown';
  END CASE;
  
  -- Se o pagamento foi confirmado, ativar a assinatura
  IF v_payment_status = 'paid' THEN
    -- Atualizar o status da assinatura
    UPDATE user_plan_subscriptions
    SET 
      status = 'active',
      payment_status = v_payment_status,
      updated_at = NOW()
    WHERE id = v_subscription_id;
    
    -- Cancelar outras assinaturas pendentes do mesmo usuu00e1rio
    WITH subscription_user AS (
      SELECT user_id FROM user_plan_subscriptions WHERE id = v_subscription_id
    )
    UPDATE user_plan_subscriptions
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE user_id IN (SELECT user_id FROM subscription_user)
      AND id != v_subscription_id
      AND status = 'pending';
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Assinatura ativada com sucesso',
      'subscription_id', v_subscription_id,
      'payment_status', v_payment_status
    );
  ELSE
    -- Apenas atualizar o status de pagamento
    UPDATE user_plan_subscriptions
    SET 
      payment_status = v_payment_status,
      updated_at = NOW()
    WHERE id = v_subscription_id;
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Status de pagamento atualizado',
      'subscription_id', v_subscription_id,
      'payment_status', v_payment_status
    );
  END IF;
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao processar webhook de pagamento: ' || SQLERRM
  );
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(jsonb) TO service_role;

-- 3. Modificar a funu00e7u00e3o process_asaas_webhook para usar a nova funu00e7u00e3o process_payment_webhook
DO $$
DECLARE
  v_function_body text;
BEGIN
  -- Verificar se a funu00e7u00e3o process_asaas_webhook existe
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'process_asaas_webhook'
  ) THEN
    -- Obter o corpo da funu00e7u00e3o
    SELECT pg_get_functiondef(p.oid) INTO v_function_body
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'process_asaas_webhook';
    
    RAISE NOTICE 'A funu00e7u00e3o process_asaas_webhook existe. Nu00e3o vamos modificu00e1-la para evitar problemas.';
    RAISE NOTICE 'Recomendamos verificar manualmente se a funu00e7u00e3o process_asaas_webhook estu00e1 chamando process_payment_webhook quando recebe um evento de pagamento.';
  ELSE
    RAISE NOTICE 'A funu00e7u00e3o process_asaas_webhook nu00e3o existe. Vamos criar uma versu00e3o simples que chama process_payment_webhook.';
    
    EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION public.process_asaas_webhook(payload jsonb)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $BODY$
    DECLARE
      payment_data jsonb;
      event_type text;
      result jsonb;
    BEGIN
      -- Extrair dados do pagamento e tipo de evento
      payment_data := payload->'payment';
      event_type := payload->>'event';
      
      -- Registrar o evento de webhook
      INSERT INTO public.asaas_webhook_events (
        event_type,
        event_data,
        processed,
        processed_at
      ) VALUES (
        event_type,
        payload,
        false,
        NULL
      );
      
      -- Processar eventos de pagamento
      IF event_type LIKE 'PAYMENT_%' AND payment_data IS NOT NULL THEN
        result := process_payment_webhook(payment_data);
      ELSE
        result := jsonb_build_object(
          'success', true,
          'message', 'Evento registrado, mas nu00e3o processado: ' || event_type
        );
      END IF;
      
      -- Marcar o evento como processado
      UPDATE public.asaas_webhook_events
      SET 
        processed = true,
        processed_at = NOW()
      WHERE event_data = payload;
      
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      -- Registrar erro
      UPDATE public.asaas_webhook_events
      SET 
        processed = false,
        error_message = SQLERRM
      WHERE event_data = payload;
      
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Erro ao processar webhook: ' || SQLERRM
      );
    END;
    $BODY$;
    $FUNC$;
    
    -- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
    GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO service_role;
    
    RAISE NOTICE 'Funu00e7u00e3o process_asaas_webhook criada com sucesso.';
  END IF;
END;
$$;

-- 4. Testar se a funu00e7u00e3o asaas_api estu00e1 funcionando corretamente
DO $$
DECLARE
  v_response jsonb;
BEGIN
  BEGIN
    -- Testar a funu00e7u00e3o com um comando simples
    SELECT asaas_api('ping', '{}'::jsonb) INTO v_response;
    
    RAISE NOTICE 'Teste da funu00e7u00e3o asaas_api bem-sucedido: %', v_response;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao testar a funu00e7u00e3o asaas_api: %', SQLERRM;
  END;
END;
$$;
