-- Script para corrigir o fluxo de pagamento com o Asaas

-- 1. Restaurar a funu00e7u00e3o check_active_subscription para o comportamento original
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

-- 2. Verificar e corrigir permissu00f5es da funu00e7u00e3o asaas_api
DO $$
BEGIN
  -- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
  BEGIN
    GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.asaas_api(text, jsonb) TO service_role;
    RAISE NOTICE 'Permissu00f5es da funu00e7u00e3o asaas_api atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da funu00e7u00e3o asaas_api: %', SQLERRM;
  END;
END;
$$;

-- 3. Verificar e corrigir permissu00f5es da tabela asaas_customers
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

-- 4. Verificar e corrigir permissu00f5es da tabela user_plan_subscriptions
DO $$
BEGIN
  -- Garantir que a tabela tenha as permissu00f5es corretas
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.user_plan_subscriptions TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.user_plan_subscriptions TO service_role;
    RAISE NOTICE 'Permissu00f5es da tabela user_plan_subscriptions atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissu00f5es da tabela user_plan_subscriptions: %', SQLERRM;
  END;
END;
$$;

-- 5. Criar uma funu00e7u00e3o para processar webhooks de pagamento
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

-- 6. Testar se a funu00e7u00e3o asaas_api estu00e1 funcionando corretamente
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
