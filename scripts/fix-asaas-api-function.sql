-- Script para corrigir a função asaas_api para usar valores padrão para campos obrigatórios

CREATE OR REPLACE FUNCTION public.asaas_api(action text, data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Obter configurações do Asaas com mais detalhes de log
  RAISE NOTICE 'Buscando configurações do Asaas...';
  
  SELECT value INTO settings
  FROM system_settings
  WHERE key = 'asaas_settings';

  IF NOT FOUND THEN
    RAISE NOTICE 'Configurações não encontradas na tabela system_settings';
    RAISE EXCEPTION 'Configurações do Asaas não encontradas';
  END IF;

  -- Log detalhado das configurações
  RAISE NOTICE 'Configurações encontradas: %', jsonb_build_object(
    'environment', settings->>'environment',
    'has_sandbox_key', (settings->>'sandbox_api_key' IS NOT NULL),
    'has_production_key', (settings->>'production_api_key' IS NOT NULL),
    'sandbox_key_length', CASE WHEN settings->>'sandbox_api_key' IS NOT NULL THEN length(settings->>'sandbox_api_key') ELSE 0 END,
    'production_key_length', CASE WHEN settings->>'production_api_key' IS NOT NULL THEN length(settings->>'production_api_key') ELSE 0 END
  );

  -- Definir API key e URL baseado no ambiente
  IF settings->>'environment' = 'production' THEN
    api_key := settings->>'production_api_key';
    api_url := 'https://api.asaas.com/v3';
    RAISE NOTICE 'Usando ambiente de produção';
  ELSE
    api_key := settings->>'sandbox_api_key';
    api_url := 'https://api-sandbox.asaas.com/v3';
    RAISE NOTICE 'Usando ambiente sandbox';
  END IF;

  -- Validar API key
  IF api_key IS NULL OR api_key = '' THEN
    RAISE NOTICE 'API key está vazia ou nula para o ambiente %', settings->>'environment';
    RAISE EXCEPTION 'API key não configurada para o ambiente %', settings->>'environment';
  END IF;

  -- Log da URL e action
  RAISE NOTICE 'URL base: %, Action: %', api_url, action;

  -- Log da API key (apenas os primeiros caracteres)
  RAISE NOTICE 'API key começa com: % (comprimento total: %)', 
    substring(api_key from 1 for 10), 
    length(api_key);

  -- Definir endpoint e dados baseado na ação
  CASE action
    WHEN 'createCustomer' THEN
      -- Usar valores padrão para campos obrigatórios se estiverem faltando
      DECLARE
        customer_name text;
        customer_email text;
        customer_cpf_cnpj text;
      BEGIN
        -- Garantir que temos valores para os campos obrigatórios
        customer_name := COALESCE(data->>'name', 'Cliente Padrão');
        customer_email := COALESCE(data->>'email', 'cliente@exemplo.com');
        customer_cpf_cnpj := COALESCE(data->>'cpfCnpj', '00000000000');
        
        -- Remover caracteres não numéricos do CPF/CNPJ
        customer_cpf_cnpj := regexp_replace(customer_cpf_cnpj, '[^0-9]', '', 'g');
        
        -- Log dos dados do cliente (sem dados sensíveis)
        RAISE NOTICE 'Criando cliente com nome: %, email: %, CPF/CNPJ: %', 
          customer_name,
          customer_email,
          CASE 
            WHEN length(customer_cpf_cnpj) <= 5 THEN '***' || right(customer_cpf_cnpj, 2)
            ELSE left(customer_cpf_cnpj, 3) || '***' || right(customer_cpf_cnpj, 2)
          END;

        -- Construir o corpo da requisição
        request_body := jsonb_build_object(
          'name', customer_name,
          'email', customer_email,
          'cpfCnpj', customer_cpf_cnpj,
          'notificationDisabled', false
        );
      END;

      -- Log do request
      RAISE NOTICE 'Enviando request para criar cliente: %', request_body;

      -- Fazer a requisição
      BEGIN
        http_response := extensions.http((
          'POST',
          api_url || '/customers',
          ARRAY[
            ('accept', 'application/json')::extensions.http_header,
            ('access_token', api_key)::extensions.http_header,
            ('Content-Type', 'application/json')::extensions.http_header
          ],
          'application/json',
          request_body::text
        )::extensions.http_request);

        -- Log detalhado da resposta
        RAISE NOTICE 'Resposta da criação do cliente - Status: %, Body: %',
          http_response.status,
          http_response.content;

      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro na chamada HTTP para criar cliente: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'Erro na chamada para o Asaas: %', SQLERRM;
      END;

      -- Verificar status da resposta
      IF http_response.status < 200 OR http_response.status >= 300 THEN
        RAISE NOTICE 'Erro na API do Asaas ao criar cliente. Status: %, Response: %', 
          http_response.status, http_response.content;
        RAISE EXCEPTION 'Erro na API do Asaas. Status: %, Response: %', 
          http_response.status, http_response.content;
      END IF;

      -- Converter resposta para JSON
      BEGIN
        response := http_response.content::jsonb;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao converter resposta para JSON: %, Conteúdo: %', SQLERRM, http_response.content;
        RAISE EXCEPTION 'Resposta inválida do Asaas: %', http_response.content;
      END;

    WHEN 'createPayment' THEN
      -- Validar campos obrigatórios
      IF data->>'customer' IS NULL THEN
        RAISE EXCEPTION 'Campo obrigatório faltando para criar pagamento: customer';
      END IF;

      -- Usar valores padrão para campos opcionais
      DECLARE
        billing_type text;
        payment_value numeric;
        due_date text;
      BEGIN
        -- Garantir que temos valores para os campos
        billing_type := COALESCE(data->>'billingType', 'UNDEFINED');
        payment_value := COALESCE((data->>'value')::numeric, 0.01); -- Valor mínimo
        due_date := COALESCE(data->>'dueDate', (NOW() + INTERVAL '7 days')::date::text);
        
        -- Log dos dados do pagamento
        RAISE NOTICE 'Criando pagamento - Cliente: %, Tipo: %, Valor: %',
          data->>'customer',
          billing_type,
          payment_value;

        -- Construir o corpo da requisição
        request_body := jsonb_build_object(
          'customer', data->>'customer',
          'billingType', billing_type,
          'value', payment_value,
          'dueDate', due_date,
          'description', COALESCE(data->>'description', 'Pagamento TreinePass'),
          'externalReference', data->>'externalReference'
        );
      END;

      -- Log do request
      RAISE NOTICE 'Enviando request para criar pagamento: %', request_body;

      -- Fazer a requisição
      BEGIN
        http_response := extensions.http((
          'POST',
          api_url || '/payments',
          ARRAY[
            ('accept', 'application/json')::extensions.http_header,
            ('access_token', api_key)::extensions.http_header,
            ('Content-Type', 'application/json')::extensions.http_header
          ],
          'application/json',
          request_body::text
        )::extensions.http_request);

        -- Log detalhado da resposta
        RAISE NOTICE 'Resposta da criação do pagamento - Status: %, Body: %',
          http_response.status,
          http_response.content;

      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro na chamada HTTP para criar pagamento: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'Erro na chamada para o Asaas: %', SQLERRM;
      END;

      -- Verificar status da resposta
      IF http_response.status < 200 OR http_response.status >= 300 THEN
        RAISE NOTICE 'Erro na API do Asaas ao criar pagamento. Status: %, Response: %', 
          http_response.status, http_response.content;
        RAISE EXCEPTION 'Erro na API do Asaas. Status: %, Response: %', 
          http_response.status, http_response.content;
      END IF;

      -- Converter resposta para JSON
      BEGIN
        payment_response := http_response.content::jsonb;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao converter resposta para JSON: %, Conteúdo: %', SQLERRM, http_response.content;
        RAISE EXCEPTION 'Resposta inválida do Asaas: %', http_response.content;
      END;

      -- Se for PIX, buscar QR Code
      IF request_body->>'billingType' = 'PIX' AND payment_response->>'id' IS NOT NULL THEN
        RAISE NOTICE 'Buscando QR Code PIX para pagamento %', payment_response->>'id';
        
        BEGIN
          http_response := extensions.http((
            'GET',
            api_url || '/payments/' || (payment_response->>'id') || '/pixQrCode',
            ARRAY[
              ('accept', 'application/json')::extensions.http_header,
              ('access_token', api_key)::extensions.http_header
            ],
            'application/json',
            NULL
          )::extensions.http_request);

          -- Log da resposta do QR Code
          RAISE NOTICE 'Resposta do QR Code - Status: %, Body: %',
            http_response.status,
            http_response.content;

        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Erro ao buscar QR Code: %, SQLSTATE: %', SQLERRM, SQLSTATE;
          RAISE EXCEPTION 'Erro ao buscar QR Code: %', SQLERRM;
        END;

        -- Verificar status da resposta
        IF http_response.status < 200 OR http_response.status >= 300 THEN
          RAISE NOTICE 'Erro ao buscar QR Code. Status: %, Response: %',
            http_response.status, http_response.content;
          RAISE EXCEPTION 'Erro ao buscar QR Code. Status: %, Response: %',
            http_response.status, http_response.content;
        END IF;

        -- Converter resposta para JSON e incluir o ID do pagamento
        BEGIN
          response := http_response.content::jsonb;
          response := response || jsonb_build_object('payment_id', payment_response->>'id');
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Erro ao converter resposta do QR Code para JSON: %, Conteúdo: %',
            SQLERRM, http_response.content;
          RAISE EXCEPTION 'Resposta inválida do QR Code: %', http_response.content;
        END;
      ELSE
        response := payment_response;
      END IF;

    -- Resto do código permanece o mesmo
    WHEN 'createPaymentLink' THEN
      -- Validar campos obrigatórios
      IF data->>'customer' IS NULL THEN
        RAISE EXCEPTION 'Campo obrigatório faltando para criar link de pagamento: customer';
      END IF;

      -- Usar valores padrão para campos opcionais
      DECLARE
        payment_value numeric;
        payment_name text;
      BEGIN
        -- Garantir que temos valores para os campos
        payment_value := COALESCE((data->>'value')::numeric, 0.01); -- Valor mínimo
        payment_name := COALESCE(data->>'name', 'Pagamento TreinePass');
        
        -- Log dos dados do pagamento
        RAISE NOTICE 'Criando link de pagamento - Cliente: %, Valor: %, Nome: %',
          data->>'customer',
          payment_value,
          payment_name;

        -- Construir o corpo da requisição
        request_body := jsonb_build_object(
          'customer', data->>'customer',
          'billingType', 'UNDEFINED', -- Cliente escolhe no checkout
          'value', payment_value,
          'name', payment_name,
          'description', COALESCE(data->>'description', 'Pagamento TreinePass'),
          'externalReference', data->>'externalReference',
          'dueDateLimitDays', 7, -- 7 dias para pagar
          'subscriptionCycle', 'MONTHLY', -- Assinatura mensal
          'maxInstallments', 12, -- Máximo de 12 parcelas
          'notificationEnabled', true
        );
      END;

      -- Log do request
      RAISE NOTICE 'Enviando request para criar link de pagamento: %', request_body;

      -- Fazer a requisição
      BEGIN
        http_response := extensions.http((
          'POST',
          api_url || '/paymentLinks',
          ARRAY[
            ('accept', 'application/json')::extensions.http_header,
            ('access_token', api_key)::extensions.http_header,
            ('Content-Type', 'application/json')::extensions.http_header
          ],
          'application/json',
          request_body::text
        )::extensions.http_request);

        -- Log detalhado da resposta
        RAISE NOTICE 'Resposta da criação do link - Status: %, Body: %',
          http_response.status,
          http_response.content;

      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro na chamada HTTP para criar link: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'Erro na chamada para o Asaas: %', SQLERRM;
      END;

      -- Verificar status da resposta
      IF http_response.status < 200 OR http_response.status >= 300 THEN
        RAISE NOTICE 'Erro na API do Asaas ao criar link. Status: %, Response: %', 
          http_response.status, http_response.content;
        RAISE EXCEPTION 'Erro na API do Asaas. Status: %, Response: %', 
          http_response.status, http_response.content;
      END IF;

      -- Converter resposta para JSON
      BEGIN
        response := http_response.content::jsonb;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao converter resposta para JSON: %, Conteúdo: %', SQLERRM, http_response.content;
        RAISE EXCEPTION 'Resposta inválida do Asaas: %', http_response.content;
      END;

    WHEN 'createSubscription' THEN
      -- Validar campos obrigatórios
      IF data->>'customer' IS NULL THEN
        RAISE EXCEPTION 'Campo obrigatório faltando para criar assinatura: customer';
      END IF;

      -- Usar valores padrão para campos opcionais
      DECLARE
        subscription_value numeric;
      BEGIN
        -- Garantir que temos valores para os campos
        subscription_value := COALESCE((data->>'value')::numeric, 0.01); -- Valor mínimo
        
        -- Log dos dados da assinatura
        RAISE NOTICE 'Criando assinatura - Cliente: %, Valor: %',
          data->>'customer',
          subscription_value;

        -- Construir o corpo da requisição
        request_body := jsonb_build_object(
          'customer', data->>'customer',
          'billingType', 'UNDEFINED', -- Cliente escolhe no checkout
          'value', subscription_value,
          'nextDueDate', (NOW() + INTERVAL '7 days')::date,
          'description', COALESCE(data->>'description', 'Assinatura TreinePass'),
          'externalReference', data->>'externalReference',
          'cycle', 'MONTHLY',
          'maxPayments', 12, -- 12 meses
          'updatePendingPayments', true
        );
      END;

      -- Log do request
      RAISE NOTICE 'Enviando request para criar assinatura: %', request_body;

      -- Fazer a requisição
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

        -- Log detalhado da resposta
        RAISE NOTICE 'Resposta da criação da assinatura - Status: %, Body: %',
          http_response.status,
          http_response.content;

      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro na chamada HTTP para criar assinatura: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'Erro na chamada para o Asaas: %', SQLERRM;
      END;

      -- Verificar status da resposta
      IF http_response.status < 200 OR http_response.status >= 300 THEN
        RAISE NOTICE 'Erro na API do Asaas ao criar assinatura. Status: %, Response: %', 
          http_response.status, http_response.content;
        RAISE EXCEPTION 'Erro na API do Asaas. Status: %, Response: %', 
          http_response.status, http_response.content;
      END IF;

      -- Converter resposta para JSON
      BEGIN
        response := http_response.content::jsonb;

        -- Buscar a URL de pagamento da primeira cobrança
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
            -- Extrair a URL de pagamento da primeira cobrança
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
                RAISE NOTICE 'Nenhum pagamento encontrado para a assinatura';
              END IF;
            END;
          END IF;
        END IF;

      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao converter resposta para JSON: %, Conteúdo: %', SQLERRM, http_response.content;
        RAISE EXCEPTION 'Resposta inválida do Asaas: %', http_response.content;
      END;

    ELSE
      RAISE EXCEPTION 'Ação não suportada: %', action;
  END CASE;

  RETURN response;

EXCEPTION WHEN OTHERS THEN
  -- Log detalhado do erro
  RAISE NOTICE 'Erro na função asaas_api: %, SQLSTATE: %, SQLERRM: %', 
    SQLERRM, SQLSTATE, SQLERRM;
  RAISE;
END;
$$;
