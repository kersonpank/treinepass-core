-- Script simples para corrigir apenas o problema do redirecionamento para o checkout do Asaas

-- 1. Corrigir a função asaas_api para buscar a URL de pagamento da primeira cobrança
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
  http_response http_response;
  response_status integer;
  response_body text;
  payment_response jsonb;
  v_user_id uuid;
  v_user_record RECORD;
BEGIN
  -- Log inicial com contexto de autenticação
  RAISE NOTICE 'Iniciando asaas_api com action: %, data: %, auth.uid(): %', action, data, auth.uid();

  -- Validar action
  IF action IS NULL OR action = '' THEN
    RAISE EXCEPTION 'Action não pode ser nula ou vazia';
  END IF;

  -- Validar data
  IF data IS NULL OR data = '{}'::jsonb THEN
    RAISE EXCEPTION 'Data não pode ser nulo ou vazio';
  END IF;

  -- Obter configurações do Asaas
  SELECT value INTO settings
  FROM system_settings
  WHERE key = 'asaas_settings';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configurações do Asaas não encontradas';
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
    RAISE EXCEPTION 'API key do Asaas não configurada';
  END IF;

  -- Definir endpoint e dados baseado na ação
  CASE action
    WHEN 'createCustomer' THEN
      -- Obter o ID do usuário autenticado
      v_user_id := auth.uid();
      
      -- Se não houver usuário autenticado, usar o ID do usuário dos dados
      IF v_user_id IS NULL AND data->>'user_id' IS NOT NULL THEN
        v_user_id := (data->>'user_id')::uuid;
      END IF;
      
      -- Se tivermos um ID de usuário, buscar os dados do usuário
      IF v_user_id IS NOT NULL THEN
        SELECT * INTO v_user_record FROM auth.users WHERE id = v_user_id;
        
        -- Preencher campos faltantes com dados do usuário
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
      
      -- Validar campos obrigatórios
      IF data->>'name' IS NULL OR data->>'email' IS NULL OR data->>'cpfCnpj' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatórios faltando para criar cliente: name, email, cpfCnpj. Dados recebidos: %', data;
      END IF;

      -- Construir o corpo da requisição
      request_body := jsonb_build_object(
        'name', data->>'name',
        'email', data->>'email',
        'cpfCnpj', data->>'cpfCnpj',
        'notificationDisabled', false
      );

      -- Fazer a requisição
      http_response := http(
        'POST',
        api_url || '/customers',
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('access_token', api_key)
        ],
        request_body::text,
        NULL
      );

      -- Verificar status da resposta
      response_status := http_response.status;
      response_body := http_response.content::text;

      IF response_status >= 200 AND response_status < 300 THEN
        response := response_body::jsonb;
      ELSE
        RAISE EXCEPTION 'Erro ao criar cliente no Asaas: % (status %)', response_body, response_status;
      END IF;

    WHEN 'createSubscription' THEN
      -- Validar campos obrigatórios
      IF data->>'customer' IS NULL OR data->>'value' IS NULL THEN
        RAISE EXCEPTION 'Campos obrigatórios faltando para criar assinatura: customer, value';
      END IF;

      -- Construir o corpo da requisição
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
        'maxInstallments', 2 -- Máximo de 2 parcelas no cartão
      );

      -- Fazer a requisição para criar a assinatura
      http_response := http(
        'POST',
        api_url || '/subscriptions',
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('access_token', api_key)
        ],
        request_body::text,
        NULL
      );

      -- Verificar status da resposta
      response_status := http_response.status;
      response_body := http_response.content::text;

      IF response_status < 200 OR response_status >= 300 THEN
        RAISE EXCEPTION 'Erro na API do Asaas. Status: %, Response: %', 
          response_status, response_body;
      END IF;

      -- Converter resposta para JSON
      BEGIN
        response := response_body::jsonb;

        -- Buscar a URL de pagamento da primeira cobrança
        IF response->>'id' IS NOT NULL THEN
          http_response := http(
            'GET',
            api_url || '/subscriptions/' || (response->>'id') || '/payments',
            ARRAY[
              http_header('Content-Type', 'application/json'),
              http_header('access_token', api_key)
            ],
            NULL,
            NULL
          );

          response_status := http_response.status;
          response_body := http_response.content::text;

          IF response_status >= 200 AND response_status < 300 THEN
            -- Extrair a URL de pagamento da primeira cobrança
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
        RAISE EXCEPTION 'Resposta inválida do Asaas: %', response_body;
      END;

    ELSE
      -- Manter o comportamento original para outras ações
      RAISE EXCEPTION 'Ação desconhecida: %', action;
  END CASE;

  RETURN response;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 2. Garantir que a função tenha as permissões corretas
REVOKE ALL ON FUNCTION public.asaas_api(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO service_role;

-- 3. Corrigir permissões da tabela asaas_customers
DO $$
BEGIN
  -- Garantir que a tabela tenha as permissões corretas
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO service_role;
    RAISE NOTICE 'Permissões da tabela asaas_customers atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissões da tabela asaas_customers: %', SQLERRM;
  END;
END;
$$;
