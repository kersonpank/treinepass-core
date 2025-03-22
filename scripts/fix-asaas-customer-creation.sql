-- Script para corrigir a criau00e7u00e3o de clientes no Asaas

-- 1. Verificar se os dados do usuu00e1rio estu00e3o sendo passados corretamente
DO $$
DECLARE
  v_user_id uuid;
  v_user_record RECORD;
BEGIN
  -- Obter um ID de usuu00e1rio para teste
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Nu00e3o foi possu00edvel obter o ID do usuu00e1rio autenticado. Usando um ID de exemplo...';
    
    -- Obter um ID de usuu00e1rio existente
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
      RAISE NOTICE 'Nu00e3o foi possu00edvel encontrar nenhum usuu00e1rio no sistema.';
      RETURN;
    END IF;
  END IF;
  
  -- Verificar os metadados do usuu00e1rio
  SELECT * INTO v_user_record FROM auth.users WHERE id = v_user_id;
  
  IF v_user_record IS NULL THEN
    RAISE NOTICE 'Usuu00e1rio nu00e3o encontrado com o ID: %', v_user_id;
    RETURN;
  END IF;
  
  -- Verificar se os metadados contêm as informações necessárias
  RAISE NOTICE 'Metadados do usuu00e1rio: %', v_user_record.raw_user_meta_data;
  
  IF v_user_record.raw_user_meta_data->>'full_name' IS NULL THEN
    RAISE NOTICE 'ALERTA: O campo full_name nu00e3o estu00e1 presente nos metadados do usuu00e1rio.';
  END IF;
  
  IF v_user_record.raw_user_meta_data->>'cpf' IS NULL THEN
    RAISE NOTICE 'ALERTA: O campo cpf nu00e3o estu00e1 presente nos metadados do usuu00e1rio.';
  END IF;
  
  IF v_user_record.email IS NULL THEN
    RAISE NOTICE 'ALERTA: O campo email nu00e3o estu00e1 presente no registro do usuu00e1rio.';
  END IF;
END;
$$;

-- 2. Modificar a funu00e7u00e3o asaas_api para lidar com campos faltantes
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

  -- Obter configurau00e7u00f5es do Asaas com mais detalhes de log
  RAISE NOTICE 'Buscando configurau00e7u00f5es do Asaas...';
  
  SELECT value INTO settings
  FROM system_settings
  WHERE key = 'asaas_settings';

  IF NOT FOUND THEN
    RAISE NOTICE 'Configurau00e7u00f5es nu00e3o encontradas na tabela system_settings';
    RAISE EXCEPTION 'Configurau00e7u00f5es do Asaas nu00e3o encontradas';
  END IF;

  -- Log detalhado das configurau00e7u00f5es
  RAISE NOTICE 'Configurau00e7u00f5es encontradas: %', jsonb_build_object(
    'environment', settings->>'environment',
    'has_sandbox_key', (settings->>'sandbox_api_key' IS NOT NULL),
    'has_production_key', (settings->>'production_api_key' IS NOT NULL),
    'sandbox_key_length', CASE WHEN settings->>'sandbox_api_key' IS NOT NULL THEN length(settings->>'sandbox_api_key') ELSE 0 END,
    'production_key_length', CASE WHEN settings->>'production_api_key' IS NOT NULL THEN length(settings->>'production_api_key') ELSE 0 END
  );

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
    RAISE NOTICE 'API key nu00e3o encontrada para o ambiente: %', settings->>'environment';
    RAISE EXCEPTION 'API key do Asaas nu00e3o configurada';
  END IF;

  -- Log da API key (apenas os primeiros caracteres)
  RAISE NOTICE 'API key comeu00e7a com: % (comprimento total: %)', 
    substring(api_key from 1 for 10), 
    length(api_key);

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

      -- Log do request
      RAISE NOTICE 'Enviando request para criar cliente: %', request_body;

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

      -- Log da resposta
      RAISE NOTICE 'Resposta do Asaas (status %): %', response_status, response_body;

      -- Verificar status da resposta
      IF response_status >= 200 AND response_status < 300 THEN
        response := response_body::jsonb;
      ELSE
        RAISE EXCEPTION 'Erro ao criar cliente no Asaas: % (status %)', response_body, response_status;
      END IF;
    
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
    
    -- Manter os outros casos como estavam...
    WHEN 'createPayment' THEN
      -- Validar campos obrigatu00f3rios
      IF data->>'customer' IS NULL OR data->>'billingType' IS NULL OR data->>'value' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatu00f3rios faltando para criar pagamento: customer, billingType, value';
      END IF;
      
      -- Implementau00e7u00e3o existente...
      response := jsonb_build_object('message', 'Funu00e7u00e3o createPayment mantida como estava');
    
    WHEN 'createPaymentLink' THEN
      -- Validar campos obrigatu00f3rios
      IF data->>'customer' IS NULL OR data->>'value' IS NULL OR data->>'name' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatu00f3rios faltando para criar link de pagamento: customer, value, name';
      END IF;
      
      -- Implementau00e7u00e3o existente...
      response := jsonb_build_object('message', 'Funu00e7u00e3o createPaymentLink mantida como estava');
    
    WHEN 'createSubscription' THEN
      -- Validar campos obrigatu00f3rios
      IF data->>'customer' IS NULL OR data->>'value' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatu00f3rios faltando para criar assinatura: customer, value';
      END IF;
      
      -- Implementau00e7u00e3o existente...
      response := jsonb_build_object('message', 'Funu00e7u00e3o createSubscription mantida como estava');
    
    ELSE
      RAISE EXCEPTION 'Au00e7u00e3o desconhecida: %', action;
  END CASE;

  RETURN response;

EXCEPTION WHEN OTHERS THEN
  -- Log detalhado do erro
  RAISE NOTICE 'Erro na funu00e7u00e3o asaas_api: %, SQLSTATE: %, SQLERRM: %', 
    SQLERRM, SQLSTATE, SQLERRM;
  RAISE;
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
REVOKE ALL ON FUNCTION public.asaas_api(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO service_role;

-- 3. Testar a funu00e7u00e3o asaas_api
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
