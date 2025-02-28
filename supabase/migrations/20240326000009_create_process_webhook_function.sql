
CREATE OR REPLACE FUNCTION public.process_asaas_webhook(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_data jsonb;
  subscription_id text;
  payment_status text;
  payment_record record;
  subscription_record record;
  webhook_event_id uuid;
BEGIN
  -- Log inicial
  RAISE NOTICE 'Processando webhook do Asaas: %', payload;

  -- Extrair dados do pagamento
  payment_data := payload->'payment';
  IF payment_data IS NULL THEN
    RAISE EXCEPTION 'Payload inválido: payment não encontrado';
  END IF;

  -- Registrar o evento do webhook
  INSERT INTO public.asaas_webhook_events (
    payment_id,
    event_type,
    status,
    payload,
    processed,
    processed_at
  ) VALUES (
    payment_data->>'id',
    payload->>'event',
    payment_data->>'status',
    payload,
    false,
    NULL
  ) RETURNING id INTO webhook_event_id;

  -- Mapear status do Asaas para nosso sistema
  payment_status := CASE payment_data->>'status'
    WHEN 'CONFIRMED' THEN 'paid'
    WHEN 'RECEIVED' THEN 'paid'
    WHEN 'RECEIVED_IN_CASH' THEN 'paid'
    WHEN 'PENDING' THEN 'pending'
    WHEN 'AWAITING_RISK_ANALYSIS' THEN 'pending'
    WHEN 'APPROVED_BY_RISK_ANALYSIS' THEN 'pending'
    WHEN 'PAYMENT_REPROVED_BY_RISK_ANALYSIS' THEN 'failed'
    WHEN 'OVERDUE' THEN 'overdue'
    WHEN 'REFUNDED' THEN 'refunded'
    WHEN 'REFUND_REQUESTED' THEN 'refunded'
    WHEN 'REFUND_IN_PROGRESS' THEN 'refunded'
    WHEN 'PARTIALLY_REFUNDED' THEN 'refunded'
    WHEN 'CHARGEBACK_REQUESTED' THEN 'refunded'
    WHEN 'CHARGEBACK_DISPUTE' THEN 'refunded'
    WHEN 'AWAITING_CHARGEBACK_REVERSAL' THEN 'refunded'
    WHEN 'DUNNING_REQUESTED' THEN 'overdue'
    WHEN 'DUNNING_RECEIVED' THEN 'overdue'
    WHEN 'CANCELLED' THEN 'cancelled'
    WHEN 'PAYMENT_DELETED' THEN 'cancelled'
    ELSE 'pending'
  END;

  -- Buscar pagamento no nosso sistema
  SELECT * INTO payment_record
  FROM asaas_payments
  WHERE asaas_id = (payment_data->>'id');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento não encontrado: %', payment_data->>'id';
  END IF;

  -- Atualizar status do pagamento
  UPDATE asaas_payments
  SET 
    status = payment_status,
    billing_type = payment_data->>'billingType',
    updated_at = NOW()
  WHERE id = payment_record.id;

  -- Se o pagamento foi confirmado, atualizar a assinatura
  IF payment_status = 'paid' THEN
    -- Buscar assinatura
    SELECT * INTO subscription_record
    FROM user_plan_subscriptions
    WHERE id = payment_record.subscription_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Assinatura não encontrada: %', payment_record.subscription_id;
    END IF;

    -- Atualizar status da assinatura
    UPDATE user_plan_subscriptions
    SET 
      status = 'active',
      payment_status = 'paid',
      updated_at = NOW()
    WHERE id = subscription_record.id;

    -- Notificar usuário (implementar depois)
    -- TODO: Implementar notificação
  END IF;

  -- Marcar evento como processado
  UPDATE public.asaas_webhook_events
  SET 
    processed = true,
    processed_at = NOW()
  WHERE id = webhook_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', payment_record.id,
    'subscription_id', subscription_record.id,
    'status', payment_status,
    'webhook_event_id', webhook_event_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Se houver erro, marcar evento como não processado
  IF webhook_event_id IS NOT NULL THEN
    UPDATE public.asaas_webhook_events
    SET 
      processed = false,
      processed_at = NOW()
    WHERE id = webhook_event_id;
  END IF;

  RAISE NOTICE 'Erro ao processar webhook: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'webhook_event_id', webhook_event_id
  );
END;
$$;

-- Garantir permissões
REVOKE ALL ON FUNCTION public.process_asaas_webhook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO service_role; 
