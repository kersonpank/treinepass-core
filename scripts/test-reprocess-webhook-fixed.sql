-- Script para testar a funu00e7u00e3o reprocess_failed_webhook_event corrigida

-- Primeiro, vamos corrigir a funu00e7u00e3o
DROP FUNCTION IF EXISTS public.reprocess_failed_webhook_event(uuid);

CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(webhook_event_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    webhook_event RECORD;
    result JSONB;
BEGIN
    -- Obter os dados do evento
    SELECT * INTO webhook_event
    FROM public.asaas_webhook_events
    WHERE id = webhook_event_id;
    
    IF webhook_event IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Evento nu00e3o encontrado'
        );
    END IF;
    
    -- Usar o campo payload se existir, caso contru00e1rio usar event_data
    IF webhook_event.payload IS NOT NULL THEN
        -- Reprocessar o evento
        result := public.process_asaas_webhook(webhook_event.payload);
    ELSIF webhook_event.event_data IS NOT NULL THEN
        -- Compatibilidade com versu00e3o anterior
        result := public.process_asaas_webhook(webhook_event.event_data);
    ELSE
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Evento nu00e3o contu00e9m dados para reprocessamento'
        );
    END IF;
    
    -- Atualizar o registro do evento
    UPDATE public.asaas_webhook_events
    SET processed = (result->>'success')::BOOLEAN,
        processed_at = NOW(),
        retry_count = COALESCE(retry_count, 0) + 1,
        error_message = CASE 
                        WHEN (result->>'success')::BOOLEAN THEN NULL 
                        ELSE result->>'error' 
                        END
    WHERE id = webhook_event_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Evento reprocessado',
        'result', result
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'message', SQLERRM
    );
END;
$$;

-- Atualizar permissu00f5es
REVOKE ALL ON FUNCTION public.reprocess_failed_webhook_event(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reprocess_failed_webhook_event(UUID) TO service_role;

-- Agora, vamos testar reprocessando os eventos pendentes
SELECT id, event_type, processed, error_message
FROM asaas_webhook_events
WHERE processed = FALSE
ORDER BY created_at DESC
LIMIT 10;

-- Reprocessar eventos pendentes
SELECT 
    id,
    event_type,
    (reprocess_failed_webhook_event(id))->>'success' as success,
    (reprocess_failed_webhook_event(id))->>'message' as message
FROM asaas_webhook_events
WHERE processed = FALSE
ORDER BY created_at DESC
LIMIT 3;
