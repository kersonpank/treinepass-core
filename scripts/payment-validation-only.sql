-- Script para implementar a lu00f3gica onde o Asaas apenas valida pagamentos
-- e o gerenciamento de assinaturas u00e9 feito pelo nosso sistema

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

-- 2. Criar uma funu00e7u00e3o simplificada para processar webhooks de pagamento
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
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
  external_reference TEXT;
  subscription_id UUID;
  result JSONB;
  debug_info JSONB;
BEGIN
  -- Extrair tipo de evento e dados
  event_type := payload->>'event';
  payment_data := payload->'payment';
  
  -- Inicializar debug_info
  debug_info := jsonb_build_object(
    'event_type', event_type,
    'timestamp', NOW()
  );
  
  -- Verificar se u00e9 um evento de pagamento
  IF event_type LIKE 'PAYMENT_%' AND payment_data IS NOT NULL THEN
    payment_id := payment_data->>'id';
    payment_status := payment_data->>'status';
    external_reference := payment_data->>'externalReference';
    
    debug_info := debug_info || jsonb_build_object(
      'payment_id', payment_id,
      'payment_status', payment_status,
      'external_reference', external_reference
    );
    
    -- Verificar se temos uma referencia externa vu00e1lida (ID da assinatura)
    IF external_reference IS NOT NULL AND external_reference != '' THEN
      BEGIN
        -- Tentar converter para UUID
        subscription_id := external_reference::UUID;
        
        -- Verificar se a assinatura existe
        IF EXISTS (SELECT 1 FROM user_plan_subscriptions WHERE id = subscription_id) THEN
          -- Atualizar o status de pagamento com base no evento do Asaas
          IF payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN
            -- Pagamento confirmado - atualizar para ativo e pago
            UPDATE user_plan_subscriptions
            SET 
              status = 'active',
              payment_status = 'paid',
              updated_at = NOW()
            WHERE id = subscription_id;
            
            debug_info := debug_info || jsonb_build_object(
              'action', 'payment_confirmed',
              'subscription_id', subscription_id
            );
            
            -- Cancelar outras assinaturas pendentes do mesmo usuu00e1rio
            WITH subscription_user AS (
              SELECT user_id 
              FROM user_plan_subscriptions 
              WHERE id = subscription_id
            )
            UPDATE user_plan_subscriptions ups
            SET 
              status = 'cancelled',
              updated_at = NOW()
            FROM subscription_user su
            WHERE ups.user_id = su.user_id
              AND ups.id != subscription_id
              AND ups.status = 'pending';
            
            result := jsonb_build_object(
              'success', true,
              'message', 'Pagamento confirmado e assinatura ativada',
              'subscription_id', subscription_id
            );
          ELSIF payment_status = 'OVERDUE' THEN
            -- Pagamento em atraso
            UPDATE user_plan_subscriptions
            SET 
              status = 'overdue',
              payment_status = 'overdue',
              updated_at = NOW()
            WHERE id = subscription_id;
            
            debug_info := debug_info || jsonb_build_object(
              'action', 'payment_overdue',
              'subscription_id', subscription_id
            );
            
            result := jsonb_build_object(
              'success', true,
              'message', 'Pagamento em atraso registrado',
              'subscription_id', subscription_id
            );
          ELSIF payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN
            -- Pagamento reembolsado ou excluu00eddo
            UPDATE user_plan_subscriptions
            SET 
              status = 'cancelled',
              payment_status = 'refunded',
              updated_at = NOW()
            WHERE id = subscription_id;
            
            debug_info := debug_info || jsonb_build_object(
              'action', 'payment_refunded_or_deleted',
              'subscription_id', subscription_id
            );
            
            result := jsonb_build_object(
              'success', true,
              'message', 'Pagamento reembolsado/excluu00eddo e assinatura cancelada',
              'subscription_id', subscription_id
            );
          ELSE
            -- Outro status de pagamento
            debug_info := debug_info || jsonb_build_object(
              'action', 'payment_other_status',
              'subscription_id', subscription_id,
              'status', payment_status
            );
            
            result := jsonb_build_object(
              'success', true,
              'message', 'Status de pagamento registrado: ' || payment_status,
              'subscription_id', subscription_id
            );
          END IF;
        ELSE
          -- Assinatura nu00e3o encontrada
          debug_info := debug_info || jsonb_build_object(
            'error', 'subscription_not_found',
            'subscription_id', subscription_id
          );
          
          result := jsonb_build_object(
            'success', false,
            'message', 'Assinatura nu00e3o encontrada com o ID: ' || subscription_id
          );
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Erro ao processar
        debug_info := debug_info || jsonb_build_object(
          'error', SQLERRM,
          'external_reference', external_reference
        );
        
        result := jsonb_build_object(
          'success', false,
          'message', 'Erro ao processar pagamento: ' || SQLERRM
        );
      END;
    ELSE
      -- Sem referencia externa
      debug_info := debug_info || jsonb_build_object(
        'error', 'no_external_reference'
      );
      
      result := jsonb_build_object(
        'success', false,
        'message', 'Nenhuma referencia externa (ID de assinatura) fornecida'
      );
    END IF;
  ELSE
    -- Nu00e3o u00e9 um evento de pagamento
    debug_info := debug_info || jsonb_build_object(
      'error', 'not_payment_event'
    );
    
    result := jsonb_build_object(
      'success', false,
      'message', 'Evento nu00e3o u00e9 de pagamento ou nu00e3o contu00e9m dados de pagamento'
    );
  END IF;
  
  -- Registrar o evento e o resultado do processamento
  INSERT INTO asaas_webhook_events (
    event_id,
    event_type,
    payment_id,
    subscription_id,
    customer_id,
    payload,
    processed,
    processed_at,
    debug_info
  ) VALUES (
    COALESCE(payload->>'id', 'evt_' || md5(payload::TEXT) || '_' || floor(random() * 10000000)),
    event_type,
    payment_id,
    CASE WHEN subscription_id IS NOT NULL THEN subscription_id::TEXT ELSE NULL END,
    payment_data->>'customer',
    payload,
    TRUE,
    NOW(),
    debug_info
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Erro inesperado
  result := jsonb_build_object(
    'success', false,
    'message', 'Erro inesperado: ' || SQLERRM
  );
  
  -- Tentar registrar o erro
  BEGIN
    INSERT INTO asaas_webhook_events (
      event_id,
      event_type,
      payload,
      processed,
      processed_at,
      error_message,
      debug_info
    ) VALUES (
      COALESCE(payload->>'id', 'evt_' || md5(payload::TEXT) || '_' || floor(random() * 10000000)),
      COALESCE(event_type, 'UNKNOWN'),
      payload,
      FALSE,
      NOW(),
      SQLERRM,
      jsonb_build_object(
        'fatal_error', SQLERRM,
        'timestamp', NOW()
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar erro ao tentar registrar o erro
  END;
  
  RETURN result;
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(jsonb) TO service_role;

-- 3. Criar uma funu00e7u00e3o para testar o processamento de um webhook
DO $$
DECLARE
  v_user_id uuid := '2ba45899-b5c7-4089-aeac-74dedcb2bfb8';
  v_subscription_id uuid;
  v_payload jsonb;
  v_result jsonb;
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
  
  -- Criar um payload simulando um evento de pagamento confirmado
  v_payload := jsonb_build_object(
    'event', 'PAYMENT_CONFIRMED',
    'payment', jsonb_build_object(
      'id', 'pay_' || md5(random()::text),
      'status', 'CONFIRMED',
      'externalReference', v_subscription_id,
      'customer', v_user_id
    )
  );
  
  -- Processar o webhook
  v_result := process_payment_webhook(v_payload);
  
  -- Exibir o resultado
  RAISE NOTICE 'Resultado do processamento: %', v_result;
  
  -- Verificar o estado atual das assinaturas do usuu00e1rio
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
