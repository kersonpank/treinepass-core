-- Script para corrigir permissu00f5es e problemas com a funu00e7u00e3o asaas_api

-- 1. Verificar e corrigir a funu00e7u00e3o asaas_api
DO $$
DECLARE
  v_count integer;
BEGIN
  -- Verificar se a funu00e7u00e3o existe
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'asaas_api';
  
  IF v_count = 0 THEN
    RAISE NOTICE 'Funu00e7u00e3o asaas_api nu00e3o encontrada. Verifique se ela foi criada corretamente.';
  ELSE
    RAISE NOTICE 'Funu00e7u00e3o asaas_api encontrada. Atualizando permissu00f5es...';
    
    -- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
    GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO service_role;
    
    RAISE NOTICE 'Permissu00f5es da funu00e7u00e3o asaas_api atualizadas.';
  END IF;
END;
$$;

-- 2. Verificar e corrigir as permissu00f5es da tabela asaas_customers
DO $$
BEGIN
  -- Verificar permissu00f5es da tabela asaas_customers
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO service_role;
    
    RAISE NOTICE 'Permissu00f5es da tabela asaas_customers atualizadas.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela asaas_customers: %', SQLERRM;
  END;
END;
$$;

-- 3. Verificar e corrigir as polu00edticas RLS da tabela asaas_customers
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
    
    -- Remover polu00edticas existentes se necessário
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem ler seus pru00f3prios registros" ON public.asaas_customers;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem inserir seus pru00f3prios registros" ON public.asaas_customers;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem atualizar seus pru00f3prios registros" ON public.asaas_customers;
    
    -- Criar polu00edticas de leitura
    CREATE POLICY "Usuu00e1rios autenticados podem ler seus pru00f3prios registros"
    ON public.asaas_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
    -- Criar polu00edticas de inserção
    CREATE POLICY "Usuu00e1rios autenticados podem inserir seus pru00f3prios registros"
    ON public.asaas_customers
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
    
    -- Criar polu00edticas de atualização
    CREATE POLICY "Usuu00e1rios autenticados podem atualizar seus pru00f3prios registros"
    ON public.asaas_customers
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
    
    RAISE NOTICE 'Polu00edticas RLS da tabela asaas_customers atualizadas.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar polu00edticas RLS da tabela asaas_customers: %', SQLERRM;
  END;
END;
$$;

-- 4. Verificar e corrigir as permissu00f5es da tabela asaas_payments
DO $$
BEGIN
  -- Verificar permissu00f5es da tabela asaas_payments
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_payments TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_payments TO service_role;
    
    RAISE NOTICE 'Permissu00f5es da tabela asaas_payments atualizadas.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela asaas_payments: %', SQLERRM;
  END;
END;
$$;

-- 5. Verificar e corrigir as polu00edticas RLS da tabela asaas_payments
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;
    
    -- Remover polu00edticas existentes se necessário
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem ler seus pru00f3prios pagamentos" ON public.asaas_payments;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem inserir seus pru00f3prios pagamentos" ON public.asaas_payments;
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem atualizar seus pru00f3prios pagamentos" ON public.asaas_payments;
    
    -- Criar polu00edticas de leitura
    CREATE POLICY "Usuu00e1rios autenticados podem ler seus pru00f3prios pagamentos"
    ON public.asaas_payments
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM asaas_customers ac
        WHERE ac.id = asaas_payments.customer_id
        AND ac.user_id = auth.uid()
      )
    );
    
    -- Criar polu00edticas de inserção
    CREATE POLICY "Usuu00e1rios autenticados podem inserir seus pru00f3prios pagamentos"
    ON public.asaas_payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM asaas_customers ac
        WHERE ac.id = asaas_payments.customer_id
        AND ac.user_id = auth.uid()
      )
    );
    
    -- Criar polu00edticas de atualização
    CREATE POLICY "Usuu00e1rios autenticados podem atualizar seus pru00f3prios pagamentos"
    ON public.asaas_payments
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM asaas_customers ac
        WHERE ac.id = asaas_payments.customer_id
        AND ac.user_id = auth.uid()
      )
    );
    
    RAISE NOTICE 'Polu00edticas RLS da tabela asaas_payments atualizadas.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar polu00edticas RLS da tabela asaas_payments: %', SQLERRM;
  END;
END;
$$;

-- 6. Testar a funu00e7u00e3o asaas_api
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

-- 7. Diagnosticar problemas com a funu00e7u00e3o asaas_api
DO $$
DECLARE
  v_settings jsonb;
BEGIN
  -- Verificar se as configurau00e7u00f5es do Asaas existem
  SELECT value INTO v_settings
  FROM system_settings
  WHERE key = 'asaas_settings';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Configurau00e7u00f5es do Asaas nu00e3o encontradas na tabela system_settings.';
  ELSE
    RAISE NOTICE 'Configurau00e7u00f5es do Asaas encontradas: %', jsonb_build_object(
      'environment', v_settings->>'environment',
      'has_sandbox_key', (v_settings->>'sandbox_api_key' IS NOT NULL),
      'has_production_key', (v_settings->>'production_api_key' IS NOT NULL)
    );
  END IF;
END;
$$;
