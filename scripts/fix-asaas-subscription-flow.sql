-- Script para corrigir o fluxo de assinatura do Asaas

-- 1. Corrigir a funu00e7u00e3o asaas_api para garantir que os dados do cliente sejam preenchidos corretamente
CREATE OR REPLACE FUNCTION public.asaas_api(action text, data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings jsonb;
  api_key text;
  api_url text;
  response jsonb;
  request_body jsonb;
  http_response extensions.http_response;
  response_status integer;
  response_body text;
  payment_response jsonb;
  v_user_id uuid;
  v_user_record RECORD;
BEGIN
  -- Log inicial com contexto de autenticau00e7u00e3o
  RAISE NOTICE 'Iniciando asaas_api com action: %, data: %, auth.uid(): %', action, data, auth.uid();

  -- Validar action
  IF action IS NULL OR action = '' THEN
    RAISE EXCEPTION 'Action nu00e3o pode ser nula ou vazia';
  END IF;

  -- Validar data
  IF data IS NULL OR data = '{}'::jsonb THEN
    RAISE EXCEPTION 'Data nu00e3o pode ser nulo ou vazio';
  END IF;

  -- Obter configurau00e7u00f5es do Asaas
  SELECT value INTO settings
  FROM system_settings
  WHERE key = 'asaas_settings';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configurau00e7u00f5es do Asaas nu00e3o encontradas';
  END IF;

  -- Definir API key e URL baseado no ambiente
  IF settings->>'environment' = 'sandbox' THEN
    api_key := settings->>'sandbox_api_key';
    api_url := 'https://sandbox.asaas.com/api/v3';
  ELSE
    api_key := settings->>'production_api_key';
    api_url := 'https://www.asaas.com/api/v3';
  END IF;

  -- Validar API key
  IF api_key IS NULL OR api_key = '' THEN
    RAISE EXCEPTION 'API key do Asaas nu00e3o configurada';
  END IF;

  -- Definir endpoint e dados baseado na au00e7u00e3o
  CASE action
    WHEN 'createCustomer' THEN
      -- Obter o ID do usuu00e1rio autenticado
      v_user_id := auth.uid();
      
      -- Se nu00e3o houver usuu00e1rio autenticado, usar o ID do usuu00e1rio dos dados
      IF v_user_id IS NULL AND data->>'user_id' IS NOT NULL THEN
        v_user_id := (data->>'user_id')::uuid;
      END IF;
      
      -- Se tivermos um ID de usuu00e1rio, buscar os dados do usuu00e1rio
      IF v_user_id IS NOT NULL THEN
        SELECT * INTO v_user_record FROM auth.users WHERE id = v_user_id;
        
        -- Preencher campos faltantes com dados do usuu00e1rio
        IF v_user_record IS NOT NULL THEN
          IF data->>'name' IS NULL AND v_user_record.raw_user_meta_data->>'full_name' IS NOT NULL THEN
            data := data || jsonb_build_object('name', v_user_record.raw_user_meta_data->>'full_name');
          END IF;
          
          IF data->>'email' IS NULL AND v_user_record.email IS NOT NULL THEN
            data := data || jsonb_build_object('email', v_user_record.email);
          END IF;
          
          IF data->>'cpfCnpj' IS NULL AND v_user_record.raw_user_meta_data->>'cpf' IS NOT NULL THEN
            data := data || jsonb_build_object('cpfCnpj', v_user_record.raw_user_meta_data->>'cpf');
          END IF;
        END IF;
      END IF;
      
      -- Validar campos obrigatu00f3rios
      IF data->>'name' IS NULL OR data->>'email' IS NULL OR data->>'cpfCnpj' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatu00f3rios faltando para criar cliente: name, email, cpfCnpj. Dados recebidos: %', data;
      END IF;

      -- Construir o corpo da requisiu00e7u00e3o
      request_body := jsonb_build_object(
        'name', data->>'name',
        'email', data->>'email',
        'cpfCnpj', data->>'cpfCnpj',
        'notificationDisabled', false
      );

      -- Fazer a requisiu00e7u00e3o
      SELECT
        status,
        content
      INTO
        response_status,
        response_body
      FROM
        extensions.http_post(
          url := api_url || '/customers',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'access_token', api_key
          ),
          body := request_body::text
        );

      -- Verificar status da resposta
      IF response_status >= 200 AND response_status < 300 THEN
        response := response_body::jsonb;
      ELSE
        RAISE EXCEPTION 'Erro ao criar cliente no Asaas: % (status %)', response_body, response_status;
      END IF;

    WHEN 'createSubscription' THEN
      -- Validar campos obrigatu00f3rios
      IF data->>'customer' IS NULL OR data->>'value' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatu00f3rios faltando para criar assinatura: customer, value';
      END IF;

      -- Construir o corpo da requisiu00e7u00e3o
      request_body := jsonb_build_object(
        'customer', data->>'customer',
        'billingType', 'UNDEFINED', -- Cliente escolhe no checkout
        'value', (data->>'value')::numeric,
        'nextDueDate', (NOW() + INTERVAL '1 day')::date,
        'description', data->>'description',
        'externalReference', data->>'externalReference',
        'cycle', 'MONTHLY',
        'maxPayments', 12, -- 12 meses
        'updatePendingPayments', true,
        'maxInstallments', 2 -- Mu00e1ximo de 2 parcelas no cartu00e3o
      );

      -- Fazer a requisiu00e7u00e3o
      BEGIN
        http_response := extensions.http((
          'POST',
          api_url || '/subscriptions',
          ARRAY[
            ('accept', 'application/json')::extensions.http_header,
            ('access_token', api_key)::extensions.http_header,
            ('Content-Type', 'application/json')::extensions.http_header
          ],
          'application/json',
          request_body::text
        )::extensions.http_request);

      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro na chamada para o Asaas: %', SQLERRM;
      END;

      -- Verificar status da resposta
      IF http_response.status < 200 OR http_response.status >= 300 THEN
        RAISE EXCEPTION 'Erro na API do Asaas. Status: %, Response: %', 
          http_response.status, http_response.content;
      END IF;

      -- Converter resposta para JSON
      BEGIN
        response := http_response.content::jsonb;

        -- Buscar a URL de pagamento da primeira cobranu00e7a
        IF response->>'id' IS NOT NULL THEN
          http_response := extensions.http((
            'GET',
            api_url || '/subscriptions/' || (response->>'id') || '/payments',
            ARRAY[
              ('accept', 'application/json')::extensions.http_header,
              ('access_token', api_key)::extensions.http_header
            ],
            'application/json',
            NULL
          )::extensions.http_request);

          IF http_response.status >= 200 AND http_response.status < 300 THEN
            -- Extrair a URL de pagamento da primeira cobranu00e7a
            DECLARE
              payments_data jsonb;
              first_payment jsonb;
            BEGIN
              payments_data := http_response.content::jsonb;
              
              IF payments_data->>'object' = 'list' AND jsonb_array_length(payments_data->'data') > 0 THEN
                first_payment := payments_data->'data'->0;
                response := response || jsonb_build_object(
                  'invoiceUrl', first_payment->>'invoiceUrl'
                );
              ELSE
                RAISE EXCEPTION 'Nenhum pagamento encontrado para a assinatura';
              END IF;
            END;
          END IF;
        END IF;

      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Resposta invu00e1lida do Asaas: %', http_response.content;
      END;

    WHEN 'ping' THEN
      -- Endpoint simples para testar a conexu00e3o
      SELECT
        status,
        content
      INTO
        response_status,
        response_body
      FROM
        extensions.http_get(
          url := api_url || '/customers?limit=1',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'access_token', api_key
          )
        );
      
      -- Verificar status da resposta
      IF response_status >= 200 AND response_status < 300 THEN
        response := jsonb_build_object(
          'status', 'ok',
          'message', 'Conexu00e3o com o Asaas estabelecida com sucesso',
          'api_url', api_url,
          'environment', settings->>'environment'
        );
      ELSE
        RAISE EXCEPTION 'Erro ao conectar com o Asaas: % (status %)', response_body, response_status;
      END IF;
    
    ELSE
      RAISE EXCEPTION 'Au00e7u00e3o desconhecida: %', action;
  END CASE;

  RETURN response;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 2. Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
REVOKE ALL ON FUNCTION public.asaas_api(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO service_role;

-- 3. Corrigir permissu00f5es da tabela asaas_customers
DO $$
BEGIN
  -- Garantir que a tabela tenha as permissu00f5es corretas
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO service_role;
    RAISE NOTICE 'Permissu00f5es da tabela asaas_customers atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela asaas_customers: %', SQLERRM;
  END;
  
  -- Verificar e corrigir as polu00edticas RLS
  BEGIN
    ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
    
    -- Remover polu00edticas existentes
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem ler seus pru00f3prios registros" ON public.asaas_customers;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem inserir seus pru00f3prios registros" ON public.asaas_customers;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem atualizar seus pru00f3prios registros" ON public.asaas_customers;
    
    -- Criar novas polu00edticas
    CREATE POLICY "Usuu00e1rios autenticados podem ler seus pru00f3prios registros"
    ON public.asaas_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
    CREATE POLICY "Usuu00e1rios autenticados podem inserir seus pru00f3prios registros"
    ON public.asaas_customers
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Usuu00e1rios autenticados podem atualizar seus pru00f3prios registros"
    ON public.asaas_customers
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
    
    RAISE NOTICE 'Polu00edticas RLS da tabela asaas_customers atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar polu00edticas RLS da tabela asaas_customers: %', SQLERRM;
  END;
END;
$$;

-- 4. Corrigir permissu00f5es da tabela asaas_payments
DO $$
BEGIN
  -- Garantir que a tabela tenha as permissu00f5es corretas
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_payments TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_payments TO service_role;
    RAISE NOTICE 'Permissu00f5es da tabela asaas_payments atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela asaas_payments: %', SQLERRM;
  END;
  
  -- Verificar e corrigir as polu00edticas RLS
  BEGIN
    ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;
    
    -- Remover polu00edticas existentes
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem ler seus pru00f3prios pagamentos" ON public.asaas_payments;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem inserir seus pru00f3prios pagamentos" ON public.asaas_payments;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem atualizar seus pru00f3prios pagamentos" ON public.asaas_payments;
    
    -- Criar novas polu00edticas
    CREATE POLICY "Usuu00e1rios autenticados podem ler seus pru00f3prios pagamentos"
    ON public.asaas_payments
    FOR SELECT
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM public.asaas_customers WHERE user_id = auth.uid()
      )
    );
    
    CREATE POLICY "Usuu00e1rios autenticados podem inserir seus pru00f3prios pagamentos"
    ON public.asaas_payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
      customer_id IN (
        SELECT id FROM public.asaas_customers WHERE user_id = auth.uid()
      )
    );
    
    CREATE POLICY "Usuu00e1rios autenticados podem atualizar seus pru00f3prios pagamentos"
    ON public.asaas_payments
    FOR UPDATE
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM public.asaas_customers WHERE user_id = auth.uid()
      )
    );
    
    RAISE NOTICE 'Polu00edticas RLS da tabela asaas_payments atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar polu00edticas RLS da tabela asaas_payments: %', SQLERRM;
  END;
END;
$$;

-- 5. Restaurar a funu00e7u00e3o check_active_subscription para o comportamento original
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

-- 6. Criar uma funu00e7u00e3o para processar webhooks de pagamento
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

-- 7. Modificar a funu00e7u00e3o process_asaas_webhook para usar a funu00e7u00e3o process_payment_webhook
CREATE OR REPLACE FUNCTION public.process_asaas_webhook(webhook_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type text;
  v_event_id text;
  v_payment_data jsonb;
  v_result jsonb;
BEGIN
  -- Extrair o tipo de evento
  v_event_type := webhook_data->>'event';
  
  -- Extrair o ID do evento
  v_event_id := webhook_data->>'id';
  
  -- Se nu00e3o houver ID de evento, gerar um
  IF v_event_id IS NULL THEN
    v_event_id := gen_random_uuid()::text;
  END IF;
  
  -- Registrar o evento recebido
  INSERT INTO asaas_webhook_events (
    event_id,
    event_type,
    payload,
    processed,
    error_message
  ) VALUES (
    v_event_id,
    v_event_type,
    webhook_data,
    false,
    NULL
  );
  
  -- Processar o evento com base no tipo
  CASE v_event_type
    WHEN 'PAYMENT_CREATED' THEN
      -- Processar evento de pagamento criado
      v_payment_data := webhook_data->'payment';
      v_result := process_payment_webhook(v_payment_data);
    
    WHEN 'PAYMENT_CONFIRMED' THEN
      -- Processar evento de pagamento confirmado
      v_payment_data := webhook_data->'payment';
      v_result := process_payment_webhook(v_payment_data);
    
    WHEN 'PAYMENT_RECEIVED' THEN
      -- Processar evento de pagamento recebido
      v_payment_data := webhook_data->'payment';
      v_result := process_payment_webhook(v_payment_data);
    
    WHEN 'PAYMENT_OVERDUE' THEN
      -- Processar evento de pagamento vencido
      v_payment_data := webhook_data->'payment';
      v_result := process_payment_webhook(v_payment_data);
    
    WHEN 'PAYMENT_REFUNDED' THEN
      -- Processar evento de pagamento reembolsado
      v_payment_data := webhook_data->'payment';
      v_result := process_payment_webhook(v_payment_data);
    
    ELSE
      -- Evento nu00e3o processado
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Evento nu00e3o processado: ' || v_event_type
      );
  END CASE;
  
  -- Atualizar o status do evento
  UPDATE asaas_webhook_events
  SET 
    processed = true,
    processed_at = NOW(),
    processing_result = v_result
  WHERE event_id = v_event_id;
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Registrar o erro
  UPDATE asaas_webhook_events
  SET 
    processed = false,
    error_message = SQLERRM
  WHERE event_id = v_event_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao processar webhook: ' || SQLERRM
  );
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO service_role;

-- 8. Testar a funu00e7u00e3o asaas_api
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
