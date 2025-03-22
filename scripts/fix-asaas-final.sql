-- Script final para corrigir o fluxo de pagamento com o Asaas

-- 1. Corrigir a funu00e7u00e3o asaas_api para buscar automaticamente os dados do usuu00e1rio quando faltarem
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
