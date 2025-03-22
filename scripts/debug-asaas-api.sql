-- Script para depurar a funu00e7u00e3o asaas_api

-- 1. Modificar a funu00e7u00e3o asaas_api para adicionar mais logs
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
  response_status integer;
  response_body text;
  payment_response jsonb;
  v_user_id uuid;
  v_user_record RECORD;
  v_debug_info jsonb;
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
      
      -- Criar objeto de debug
      v_debug_info := jsonb_build_object(
        'action', action,
        'original_data', data,
        'auth_uid', v_user_id
      );
      
      -- Se nu00e3o houver usuu00e1rio autenticado, usar o ID do usuu00e1rio dos dados
      IF v_user_id IS NULL AND data->>'user_id' IS NOT NULL THEN
        v_user_id := (data->>'user_id')::uuid;
        v_debug_info := v_debug_info || jsonb_build_object('user_id_from_data', v_user_id);
      END IF;
      
      -- Se tivermos um ID de usuu00e1rio, buscar os dados do usuu00e1rio
      IF v_user_id IS NOT NULL THEN
        SELECT * INTO v_user_record FROM auth.users WHERE id = v_user_id;
        
        -- Adicionar informau00e7u00f5es de debug
        IF v_user_record IS NOT NULL THEN
          v_debug_info := v_debug_info || jsonb_build_object(
            'user_found', true,
            'user_email', v_user_record.email,
            'user_metadata', v_user_record.raw_user_meta_data
          );
          
          -- Preencher campos faltantes com dados do usuu00e1rio
          IF data->>'name' IS NULL AND v_user_record.raw_user_meta_data->>'full_name' IS NOT NULL THEN
            data := data || jsonb_build_object('name', v_user_record.raw_user_meta_data->>'full_name');
            v_debug_info := v_debug_info || jsonb_build_object('name_filled_from_metadata', v_user_record.raw_user_meta_data->>'full_name');
          END IF;
          
          IF data->>'email' IS NULL AND v_user_record.email IS NOT NULL THEN
            data := data || jsonb_build_object('email', v_user_record.email);
            v_debug_info := v_debug_info || jsonb_build_object('email_filled_from_user', v_user_record.email);
          END IF;
          
          IF data->>'cpfCnpj' IS NULL AND v_user_record.raw_user_meta_data->>'cpf' IS NOT NULL THEN
            data := data || jsonb_build_object('cpfCnpj', v_user_record.raw_user_meta_data->>'cpf');
            v_debug_info := v_debug_info || jsonb_build_object('cpf_filled_from_metadata', v_user_record.raw_user_meta_data->>'cpf');
          END IF;
        ELSE
          v_debug_info := v_debug_info || jsonb_build_object('user_found', false);
        END IF;
      ELSE
        v_debug_info := v_debug_info || jsonb_build_object('user_id', null);
      END IF;
      
      -- Adicionar dados finais ao debug
      v_debug_info := v_debug_info || jsonb_build_object('final_data', data);
      
      -- Inserir informau00e7u00f5es de debug na tabela de log
      INSERT INTO debug_logs (action, data)
      VALUES ('asaas_api_debug', v_debug_info);
      
      -- Validar campos obrigatu00f3rios
      IF data->>'name' IS NULL OR data->>'email' IS NULL OR data->>'cpfCnpj' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatu00f3rios faltando para criar cliente: name, email, cpfCnpj. Dados recebidos: %', data;
      END IF;

      -- Log dos dados do cliente (sem dados sensu00edveis)
      RAISE NOTICE 'Criando cliente com nome: %, email: %', 
        data->>'name',
        data->>'email';

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

      -- Fazer a requisiu00e7u00e3o para criar a assinatura
      SELECT
        status,
        content
      INTO
        response_status,
        response_body
      FROM
        extensions.http_post(
          url := api_url || '/subscriptions',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'access_token', api_key
          ),
          body := request_body::text
        );

      -- Verificar status da resposta
      IF response_status < 200 OR response_status >= 300 THEN
        RAISE EXCEPTION 'Erro na API do Asaas. Status: %, Response: %', 
          response_status, response_body;
      END IF;

      -- Converter resposta para JSON
      BEGIN
        response := response_body::jsonb;

        -- Buscar a URL de pagamento da primeira cobranu00e7a
        IF response->>'id' IS NOT NULL THEN
          SELECT
            status,
            content
          INTO
            response_status,
            response_body
          FROM
            extensions.http_get(
              url := api_url || '/subscriptions/' || (response->>'id') || '/payments',
              headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'access_token', api_key
              )
            );

          IF response_status >= 200 AND response_status < 300 THEN
            -- Extrair a URL de pagamento da primeira cobranu00e7a
            DECLARE
              payments_data jsonb;
              first_payment jsonb;
            BEGIN
              payments_data := response_body::jsonb;
              
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
        RAISE EXCEPTION 'Resposta invu00e1lida do Asaas: %', response_body;
      END;

    ELSE
      -- Manter o comportamento original para outras au00e7u00f5es
      RAISE EXCEPTION 'Au00e7u00e3o desconhecida: %', action;
  END CASE;

  RETURN response;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 2. Criar tabela para logs de debug se nu00e3o existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'debug_logs') THEN
    CREATE TABLE public.debug_logs (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Garantir permissu00f5es
    GRANT ALL ON TABLE public.debug_logs TO postgres;
    GRANT ALL ON TABLE public.debug_logs TO service_role;
    GRANT ALL ON SEQUENCE public.debug_logs_id_seq TO postgres;
    GRANT ALL ON SEQUENCE public.debug_logs_id_seq TO service_role;
  END IF;
END;
$$;
