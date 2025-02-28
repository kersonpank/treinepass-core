-- Função para processar webhooks do Asaas
CREATE OR REPLACE FUNCTION process_asaas_webhook(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id text;
    v_event text;
    v_status text;
    v_subscription_id uuid;
BEGIN
    -- Extrair informações do payload
    v_payment_id := payload->'payment'->>'id';
    v_event := payload->>'event';
    v_status := payload->'payment'->>'status';

    -- Log das informações recebidas
    RAISE NOTICE 'Processando webhook - Payment ID: %, Event: %, Status: %', 
        v_payment_id, v_event, v_status;

    -- Validar dados necessários
    IF v_payment_id IS NULL OR v_event IS NULL OR v_status IS NULL THEN
        RAISE EXCEPTION 'Payload inválido: payment.id, event e payment.status são obrigatórios';
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
        v_payment_id,
        v_event,
        v_status,
        payload,
        true,
        NOW()
    );

    -- Atualizar status do pagamento
    UPDATE public.asaas_payments
    SET status = v_status,
        updated_at = NOW()
    WHERE asaas_id = v_payment_id
    RETURNING subscription_id INTO v_subscription_id;

    -- Se o pagamento foi confirmado, atualizar a assinatura
    IF v_status = 'CONFIRMED' OR v_status = 'RECEIVED' OR v_status = 'RECEIVED_IN_CASH' THEN
        UPDATE public.user_plan_subscriptions
        SET status = 'active',
            payment_status = 'paid',
            updated_at = NOW()
        WHERE id = v_subscription_id
        AND status = 'pending';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Webhook processado com sucesso',
        'payment_id', v_payment_id,
        'event', v_event,
        'status', v_status,
        'subscription_id', v_subscription_id
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro
        RAISE NOTICE 'Erro ao processar webhook: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        
        RETURN jsonb_build_object(
            'success', false,
            'message', SQLERRM,
            'payment_id', v_payment_id,
            'event', v_event,
            'status', v_status
        );
END;
$$;

-- Garantir permissões
REVOKE ALL ON FUNCTION public.process_asaas_webhook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO authenticated; 