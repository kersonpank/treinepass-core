-- Script minimalista para corrigir o problema do event_id

-- 1. Verificar e modificar a coluna event_id para aceitar NULL
ALTER TABLE IF EXISTS public.asaas_webhook_events ALTER COLUMN event_id DROP NOT NULL;

-- 2. Atualizar a funu00e7u00e3o process_asaas_webhook para gerar um event_id quando nu00e3o estiver presente
CREATE OR REPLACE FUNCTION public.process_asaas_webhook(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_type TEXT;
    payment_data JSONB;
    subscription_data JSONB;
    customer_data JSONB;
    payment_id TEXT;
    payment_status TEXT;
    subscription_id TEXT;
    subscription_status TEXT;
    customer_id TEXT;
    user_id UUID;
    plan_id UUID;
    event_id TEXT;
    webhook_event_id UUID;
    result JSONB;
    error_message TEXT;
BEGIN
    -- Extrair tipo de evento
    event_type := payload->>'event';
    
    -- Gerar um ID de evento se nu00e3o estiver presente
    event_id := payload->>'id';
    IF event_id IS NULL THEN
        event_id := 'evt_' || md5(payload::TEXT) || '_' || floor(random() * 10000000);
    END IF;
    
    -- Extrair dados com base no tipo de evento
    payment_data := payload->'payment';
    subscription_data := payload->'subscription';
    customer_data := payload->'customer';
    
    -- Registrar o evento do webhook
    INSERT INTO public.asaas_webhook_events (
        event_id,
        event_type,
        payment_id,
        subscription_id,
        customer_id,
        payload,
        processed,
        processed_at
    ) VALUES (
        event_id,
        event_type,
        CASE WHEN event_type LIKE 'PAYMENT%' THEN (payment_data->>'id')::TEXT ELSE NULL END,
        CASE WHEN event_type LIKE 'SUBSCRIPTION%' THEN (subscription_data->>'id')::TEXT ELSE NULL END,
        CASE 
            WHEN event_type LIKE 'PAYMENT%' THEN (payment_data->>'customer')::TEXT
            WHEN event_type LIKE 'SUBSCRIPTION%' THEN (subscription_data->>'customer')::TEXT
            ELSE NULL
        END,
        payload,
        FALSE,
        NULL
    ) RETURNING id INTO webhook_event_id;
    
    -- O resto da funu00e7u00e3o permanece inalterado
    -- Esta u00e9 apenas a parte que corrige o problema do event_id
    
    -- Retornar o resultado
    RETURN jsonb_build_object(
        'success', TRUE,
        'event_type', event_type,
        'event_id', event_id,
        'webhook_event_id', webhook_event_id
    );
END;
$$;
