-- Script para implementar o fluxo completo de pagamentos recorrentes com o Asaas
-- Neste modelo, o Asaas gerencia as cobranu00e7as recorrentes e envia webhooks para nosso sistema

-- 1. Funu00e7u00e3o para criar uma nova assinatura no nosso sistema
CREATE OR REPLACE FUNCTION public.create_subscription(
  p_user_id uuid,
  p_plan_id uuid,
  p_asaas_subscription_id text,
  p_start_date date DEFAULT CURRENT_DATE,
  p_end_date date DEFAULT (CURRENT_DATE + INTERVAL '30 days')::date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id uuid;
  v_active_subscription_id uuid;
BEGIN
  -- Verificar se o usuu00e1rio ju00e1 tem uma assinatura ativa
  SELECT id INTO v_active_subscription_id
  FROM user_plan_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND NOW() BETWEEN start_date AND end_date;
  
  -- Se o usuu00e1rio ju00e1 tiver uma assinatura ativa, marcar como pendente
  -- para ser ativada quando a atual expirar ou quando o pagamento for confirmado
  INSERT INTO user_plan_subscriptions (
    user_id,
    plan_id,
    status,
    payment_status,
    start_date,
    end_date,
    asaas_subscription_id,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_plan_id,
    CASE WHEN v_active_subscription_id IS NULL THEN 'pending' ELSE 'pending' END,
    'pending',
    p_start_date,
    p_end_date,
    p_asaas_subscription_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;

-- 2. Funu00e7u00e3o para processar webhooks de pagamento recorrente do Asaas
CREATE OR REPLACE FUNCTION public.process_recurrent_payment_webhook(
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
  asaas_subscription_id TEXT;
  billing_type TEXT;
  next_due_date TEXT;
  subscription_record RECORD;
  v_user_id uuid;
  v_plan_id uuid;
  v_subscription_id uuid;
  v_new_subscription_id uuid;
  v_end_date date;
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
    asaas_subscription_id := payment_data->>'subscription';
    billing_type := payment_data->>'billingType';
    next_due_date := payment_data->>'nextDueDate';
    
    debug_info := debug_info || jsonb_build_object(
      'payment_id', payment_id,
      'payment_status', payment_status,
      'asaas_subscription_id', asaas_subscription_id,
      'billing_type', billing_type,
      'next_due_date', next_due_date
    );
    
    -- Verificar se temos um ID de assinatura do Asaas
    IF asaas_subscription_id IS NOT NULL AND asaas_subscription_id != '' THEN
      BEGIN
        -- Buscar a assinatura correspondente no nosso sistema
        SELECT 
          ups.id, 
          ups.user_id, 
          ups.plan_id, 
          ups.status,
          ups.payment_status,
          ups.start_date,
          ups.end_date
        INTO subscription_record
        FROM user_plan_subscriptions ups
        WHERE ups.asaas_subscription_id = asaas_subscription_id
        ORDER BY ups.created_at DESC
        LIMIT 1;
        
        IF FOUND THEN
          v_user_id := subscription_record.user_id;
          v_plan_id := subscription_record.plan_id;
          v_subscription_id := subscription_record.id;
          
          -- Processar com base no status do pagamento
          IF payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN
            -- Pagamento confirmado
            
            -- 1. Atualizar a assinatura atual
            UPDATE user_plan_subscriptions
            SET 
              status = 'active',
              payment_status = 'paid',
              updated_at = NOW()
            WHERE id = v_subscription_id;
            
            -- 2. Cancelar outras assinaturas pendentes do mesmo usuu00e1rio
            UPDATE user_plan_subscriptions
            SET 
              status = 'cancelled',
              updated_at = NOW()
            WHERE user_id = v_user_id
              AND id != v_subscription_id
              AND status = 'pending';
            
            -- 3. Se for pagamento recorrente, criar a pru00f3xima assinatura pendente
            IF next_due_date IS NOT NULL AND billing_type IN ('CREDIT_CARD', 'DEBIT_CARD') THEN
              -- Calcular a data de fim com base na pru00f3xima data de vencimento
              v_end_date := (next_due_date::date + INTERVAL '30 days')::date;
              
              -- Criar a pru00f3xima assinatura pendente
              v_new_subscription_id := create_subscription(
                v_user_id,
                v_plan_id,
                asaas_subscription_id,
                next_due_date::date,
                v_end_date
              );
              
              debug_info := debug_info || jsonb_build_object(
                'next_subscription_created', true,
                'next_subscription_id', v_new_subscription_id,
                'next_start_date', next_due_date::date,
                'next_end_date', v_end_date
              );
            END IF;
            
            result := jsonb_build_object(
              'success', true,
              'message', 'Pagamento confirmado e assinatura ativada',
              'subscription_id', v_subscription_id
            );
          ELSIF payment_status = 'OVERDUE' THEN
            -- Pagamento em atraso
            UPDATE user_plan_subscriptions
            SET 
              status = 'overdue',
              payment_status = 'overdue',
              updated_at = NOW()
            WHERE id = v_subscription_id;
            
            result := jsonb_build_object(
              'success', true,
              'message', 'Pagamento em atraso registrado',
              'subscription_id', v_subscription_id
            );
          ELSIF payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN
            -- Pagamento reembolsado ou excluu00eddo
            UPDATE user_plan_subscriptions
            SET 
              status = 'cancelled',
              payment_status = 'refunded',
              updated_at = NOW()
            WHERE id = v_subscription_id;
            
            result := jsonb_build_object(
              'success', true,
              'message', 'Pagamento reembolsado/excluu00eddo e assinatura cancelada',
              'subscription_id', v_subscription_id
            );
          ELSE
            -- Outro status de pagamento
            result := jsonb_build_object(
              'success', true,
              'message', 'Status de pagamento registrado: ' || payment_status,
              'subscription_id', v_subscription_id
            );
          END IF;
        ELSE
          -- Assinatura nu00e3o encontrada no nosso sistema
          result := jsonb_build_object(
            'success', false,
            'message', 'Assinatura do Asaas nu00e3o encontrada no nosso sistema: ' || asaas_subscription_id
          );
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Erro ao processar
        result := jsonb_build_object(
          'success', false,
          'message', 'Erro ao processar pagamento: ' || SQLERRM
        );
      END;
    ELSE
      -- Sem ID de assinatura do Asaas
      result := jsonb_build_object(
        'success', false,
        'message', 'Nenhum ID de assinatura do Asaas fornecido'
      );
    END IF;
  ELSE
    -- Nu00e3o u00e9 um evento de pagamento
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
    CASE WHEN v_subscription_id IS NOT NULL THEN v_subscription_id::TEXT ELSE NULL END,
    payment_data->>'customer',
    payload,
    result->>'success' = 'true',
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

-- 3. Simular um webhook de pagamento recorrente
DO $$
DECLARE
  v_asaas_subscription_id TEXT := 'sub_abc123';
  v_user_id uuid := '2ba45899-b5c7-4089-aeac-74dedcb2bfb8';
  v_plan_id uuid;
  v_subscription_id uuid;
  v_payload jsonb;
  v_result jsonb;
  v_next_due_date date := (CURRENT_DATE + INTERVAL '30 days')::date;
BEGIN
  -- Obter um plano existente
  SELECT id INTO v_plan_id
  FROM benefit_plans
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    RAISE NOTICE 'Nenhum plano encontrado no sistema';
    RETURN;
  END IF;
  
  -- 1. Criar uma assinatura no nosso sistema
  INSERT INTO user_plan_subscriptions (
    user_id,
    plan_id,
    status,
    payment_status,
    start_date,
    end_date,
    asaas_subscription_id,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_plan_id,
    'pending',
    'pending',
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '30 days')::date,
    v_asaas_subscription_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_subscription_id;
  
  RAISE NOTICE 'Assinatura criada com ID: %', v_subscription_id;
  
  -- 2. Simular um webhook de pagamento confirmado
  v_payload := jsonb_build_object(
    'event', 'PAYMENT_CONFIRMED',
    'payment', jsonb_build_object(
      'id', 'pay_' || md5(random()::text),
      'status', 'CONFIRMED',
      'subscription', v_asaas_subscription_id,
      'billingType', 'CREDIT_CARD',
      'nextDueDate', v_next_due_date,
      'customer', v_user_id
    )
  );
  
  -- 3. Processar o webhook
  v_result := process_recurrent_payment_webhook(v_payload);
  
  -- 4. Exibir o resultado
  RAISE NOTICE 'Resultado do processamento: %', v_result;
  
  -- 5. Verificar o estado atual das assinaturas do usuu00e1rio
  RAISE NOTICE 'Estado atual das assinaturas:';
  FOR v_subscription IN (
    SELECT 
      id, 
      status, 
      payment_status, 
      start_date, 
      end_date,
      asaas_subscription_id
    FROM 
      user_plan_subscriptions
    WHERE 
      user_id = v_user_id
    ORDER BY 
      updated_at DESC
  ) LOOP
    RAISE NOTICE 'ID: %, Status: %, Payment Status: %, Period: % to %, Asaas Subscription: %', 
      v_subscription.id, 
      v_subscription.status, 
      v_subscription.payment_status, 
      v_subscription.start_date, 
      v_subscription.end_date,
      v_subscription.asaas_subscription_id;
  END LOOP;
  
  -- 6. Verificar se o usuu00e1rio tem uma assinatura ativa
  RAISE NOTICE 'O usuu00e1rio tem uma assinatura ativa? %', check_active_subscription(v_user_id);
END;
$$;
