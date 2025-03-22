-- Script para restaurar a integrau00e7u00e3o com o Asaas e corrigir problemas

-- 1. Verificar se as tabelas e funu00e7u00f5es necessu00e1rias existem
DO $$
DECLARE
  v_count integer;
BEGIN
  -- Verificar tabela asaas_customers
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'asaas_customers';
  
  IF v_count = 0 THEN
    RAISE NOTICE 'Tabela asaas_customers nu00e3o encontrada';
  ELSE
    RAISE NOTICE 'Tabela asaas_customers encontrada';
  END IF;
  
  -- Verificar funu00e7u00e3o asaas_api
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'asaas_api';
  
  IF v_count = 0 THEN
    RAISE NOTICE 'Funu00e7u00e3o asaas_api nu00e3o encontrada';
  ELSE
    RAISE NOTICE 'Funu00e7u00e3o asaas_api encontrada';
  END IF;
  
  -- Verificar funu00e7u00e3o process_asaas_webhook
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'process_asaas_webhook';
  
  IF v_count = 0 THEN
    RAISE NOTICE 'Funu00e7u00e3o process_asaas_webhook nu00e3o encontrada';
  ELSE
    RAISE NOTICE 'Funu00e7u00e3o process_asaas_webhook encontrada';
  END IF;
END;
$$;

-- 2. Garantir que a funu00e7u00e3o check_active_subscription esteja correta sem afetar outras funu00e7u00f5es
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

-- 3. Verificar e corrigir as permissu00f5es das tabelas relacionadas ao Asaas
DO $$
BEGIN
  -- Verificar permissu00f5es da tabela asaas_customers
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO service_role;
    RAISE NOTICE 'Permissu00f5es da tabela asaas_customers atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela asaas_customers: %', SQLERRM;
  END;
  
  -- Verificar permissu00f5es da tabela asaas_webhook_events
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_webhook_events TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_webhook_events TO service_role;
    RAISE NOTICE 'Permissu00f5es da tabela asaas_webhook_events atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela asaas_webhook_events: %', SQLERRM;
  END;
  
  -- Verificar permissu00f5es da tabela user_plan_subscriptions
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.user_plan_subscriptions TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.user_plan_subscriptions TO service_role;
    RAISE NOTICE 'Permissu00f5es da tabela user_plan_subscriptions atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela user_plan_subscriptions: %', SQLERRM;
  END;
END;
$$;

-- 4. Verificar e corrigir as permissu00f5es das funu00e7u00f5es relacionadas ao Asaas
DO $$
BEGIN
  -- Verificar permissu00f5es da funu00e7u00e3o asaas_api
  BEGIN
    GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO service_role;
    RAISE NOTICE 'Permissu00f5es da funu00e7u00e3o asaas_api atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da funu00e7u00e3o asaas_api: %', SQLERRM;
  END;
  
  -- Verificar permissu00f5es da funu00e7u00e3o process_asaas_webhook
  BEGIN
    GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO service_role;
    RAISE NOTICE 'Permissu00f5es da funu00e7u00e3o process_asaas_webhook atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da funu00e7u00e3o process_asaas_webhook: %', SQLERRM;
  END;
END;
$$;

-- 5. Verificar e corrigir as polu00edticas de segurana00e7a (RLS) das tabelas
DO $$
BEGIN
  -- Verificar RLS da tabela asaas_customers
  BEGIN
    ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem ler seus pru00f3prios registros" ON public.asaas_customers;
    CREATE POLICY "Usuu00e1rios autenticados podem ler seus pru00f3prios registros"
    ON public.asaas_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem inserir seus pru00f3prios registros" ON public.asaas_customers;
    CREATE POLICY "Usuu00e1rios autenticados podem inserir seus pru00f3prios registros"
    ON public.asaas_customers
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem atualizar seus pru00f3prios registros" ON public.asaas_customers;
    CREATE POLICY "Usuu00e1rios autenticados podem atualizar seus pru00f3prios registros"
    ON public.asaas_customers
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
    
    RAISE NOTICE 'Polu00edticas RLS da tabela asaas_customers atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar polu00edticas RLS da tabela asaas_customers: %', SQLERRM;
  END;
  
  -- Verificar RLS da tabela user_plan_subscriptions
  BEGIN
    ALTER TABLE public.user_plan_subscriptions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem ler suas pru00f3prias assinaturas" ON public.user_plan_subscriptions;
    CREATE POLICY "Usuu00e1rios autenticados podem ler suas pru00f3prias assinaturas"
    ON public.user_plan_subscriptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem inserir suas pru00f3prias assinaturas" ON public.user_plan_subscriptions;
    CREATE POLICY "Usuu00e1rios autenticados podem inserir suas pru00f3prias assinaturas"
    ON public.user_plan_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Usuu00e1rios autenticados podem atualizar suas pru00f3prias assinaturas" ON public.user_plan_subscriptions;
    CREATE POLICY "Usuu00e1rios autenticados podem atualizar suas pru00f3prias assinaturas"
    ON public.user_plan_subscriptions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
    
    RAISE NOTICE 'Polu00edticas RLS da tabela user_plan_subscriptions atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar polu00edticas RLS da tabela user_plan_subscriptions: %', SQLERRM;
  END;
END;
$$;

-- 6. Verificar se a funu00e7u00e3o validate_check_in_rules estu00e1 correta
CREATE OR REPLACE FUNCTION public.validate_check_in_rules(p_user_id uuid, p_academia_id uuid)
RETURNS TABLE(can_check_in boolean, message text, valor_repasse numeric, plano_id uuid, valor_plano numeric, p_num_checkins integer, remaining_daily integer, remaining_weekly integer, remaining_monthly integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_active_plan boolean;
  v_plan_id uuid;
  v_valor_plano numeric;
  v_valor_repasse numeric;
  v_num_checkins integer;
  v_checkins_diarios integer;
  v_checkins_semanais integer;
  v_checkins_mensais integer;
  v_daily_count integer;
  v_weekly_count integer;
  v_monthly_count integer;
  v_remaining_daily integer;
  v_remaining_weekly integer;
  v_remaining_monthly integer;
BEGIN
  -- Verificar se o usuu00e1rio tem um plano ativo
  v_has_active_plan := check_active_subscription(p_user_id);
  
  IF NOT v_has_active_plan THEN
    can_check_in := false;
    message := 'Usuu00e1rio nu00e3o possui um plano ativo';
    valor_repasse := 0;
    plano_id := NULL;
    valor_plano := 0;
    p_num_checkins := 0;
    remaining_daily := 0;
    remaining_weekly := 0;
    remaining_monthly := 0;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Obter informau00e7u00f5es do plano ativo
  SELECT 
    ups.plan_id,
    bp.monthly_cost,
    bp.valor_repasse,
    bp.num_checkins,
    bp.checkins_diarios,
    bp.checkins_semanais,
    bp.checkins_mensais
  INTO 
    v_plan_id,
    v_valor_plano,
    v_valor_repasse,
    v_num_checkins,
    v_checkins_diarios,
    v_checkins_semanais,
    v_checkins_mensais
  FROM 
    user_plan_subscriptions ups
    JOIN benefit_plans bp ON ups.plan_id = bp.id
  WHERE 
    ups.user_id = p_user_id
    AND ups.status = 'active'
    AND ups.payment_status = 'paid'
    AND NOW() BETWEEN ups.start_date AND ups.end_date
  LIMIT 1;
  
  -- Contar check-ins do usuu00e1rio
  -- Check-ins diu00e1rios (hoje)
  SELECT COUNT(*) INTO v_daily_count
  FROM check_ins
  WHERE user_id = p_user_id
    AND DATE(created_at) = CURRENT_DATE;
  
  -- Check-ins semanais (u00faltimos 7 dias)
  SELECT COUNT(*) INTO v_weekly_count
  FROM check_ins
  WHERE user_id = p_user_id
    AND created_at >= (CURRENT_DATE - INTERVAL '6 days')
    AND created_at < (CURRENT_DATE + INTERVAL '1 day');
  
  -- Check-ins mensais (u00faltimos 30 dias)
  SELECT COUNT(*) INTO v_monthly_count
  FROM check_ins
  WHERE user_id = p_user_id
    AND created_at >= (CURRENT_DATE - INTERVAL '29 days')
    AND created_at < (CURRENT_DATE + INTERVAL '1 day');
  
  -- Calcular limites restantes
  v_remaining_daily := GREATEST(0, v_checkins_diarios - v_daily_count);
  v_remaining_weekly := GREATEST(0, v_checkins_semanais - v_weekly_count);
  v_remaining_monthly := GREATEST(0, v_checkins_mensais - v_monthly_count);
  
  -- Verificar se o usuu00e1rio pode fazer check-in
  IF v_checkins_diarios > 0 AND v_daily_count >= v_checkins_diarios THEN
    can_check_in := false;
    message := 'Limite diu00e1rio de check-ins atingido';
  ELSIF v_checkins_semanais > 0 AND v_weekly_count >= v_checkins_semanais THEN
    can_check_in := false;
    message := 'Limite semanal de check-ins atingido';
  ELSIF v_checkins_mensais > 0 AND v_monthly_count >= v_checkins_mensais THEN
    can_check_in := false;
    message := 'Limite mensal de check-ins atingido';
  ELSE
    can_check_in := true;
    message := 'Check-in permitido';
  END IF;
  
  valor_repasse := v_valor_repasse;
  plano_id := v_plan_id;
  valor_plano := v_valor_plano;
  p_num_checkins := v_num_checkins;
  remaining_daily := v_remaining_daily;
  remaining_weekly := v_remaining_weekly;
  remaining_monthly := v_remaining_monthly;
  
  RETURN NEXT;
  RETURN;
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.validate_check_in_rules(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_check_in_rules(uuid, uuid) TO service_role;

-- 7. Testar a integrau00e7u00e3o com o Asaas
DO $$
DECLARE
  v_user_id uuid := '2ba45899-b5c7-4089-aeac-74dedcb2bfb8'; -- Substitua pelo ID do usuu00e1rio
  v_has_active_plan boolean;
BEGIN
  -- Verificar se o usuu00e1rio tem um plano ativo
  v_has_active_plan := check_active_subscription(v_user_id);
  
  RAISE NOTICE 'O usuu00e1rio tem um plano ativo? %', v_has_active_plan;
  
  -- Verificar se as funu00e7u00f5es relacionadas ao Asaas estu00e3o funcionando
  BEGIN
    PERFORM asaas_api('ping', '{}'::jsonb);
    RAISE NOTICE 'Funu00e7u00e3o asaas_api estu00e1 funcionando';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao testar funu00e7u00e3o asaas_api: %', SQLERRM;
  END;
  
  -- Verificar se as tabelas relacionadas ao Asaas estu00e3o acessu00edveis
  BEGIN
    PERFORM COUNT(*) FROM asaas_customers;
    RAISE NOTICE 'Tabela asaas_customers estu00e1 acessu00edvel';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao acessar tabela asaas_customers: %', SQLERRM;
  END;
  
  BEGIN
    PERFORM COUNT(*) FROM asaas_webhook_events;
    RAISE NOTICE 'Tabela asaas_webhook_events estu00e1 acessu00edvel';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao acessar tabela asaas_webhook_events: %', SQLERRM;
  END;
END;
$$;
