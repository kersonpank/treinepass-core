-- Verificar se a funu00e7u00e3o reprocess_failed_webhook_event existe
SELECT * FROM pg_proc WHERE proname = 'reprocess_failed_webhook_event';

-- Se a funu00e7u00e3o nu00e3o existir, criu00e1-la
CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(webhook_event_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_record record;
    result jsonb;
BEGIN
    -- Buscar o evento
    SELECT * INTO event_record
    FROM asaas_webhook_events
    WHERE id = webhook_event_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Evento nu00e3o encontrado',
            'webhook_event_id', webhook_event_id
        );
    END IF;
    
    -- Processar o evento novamente
    result := process_asaas_webhook(event_record.payload);
    
    -- Atualizar o contador de tentativas
    UPDATE asaas_webhook_events
    SET retry_count = COALESCE(retry_count, 0) + 1
    WHERE id = webhook_event_id;
    
    RETURN jsonb_build_object(
        'success', (result->>'success')::boolean,
        'webhook_event_id', webhook_event_id,
        'result', result
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'webhook_event_id', webhook_event_id
    );
END;
$$;
