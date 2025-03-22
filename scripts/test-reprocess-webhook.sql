-- Testar o reprocessamento de um webhook

-- 1. Encontrar o u00faltimo evento de webhook com erro
SELECT id, event_type, payment_id, processed, error_message, created_at
FROM asaas_webhook_events
WHERE processed = false
ORDER BY created_at DESC
LIMIT 5;

-- 2. Reprocessar o evento (substitua o ID pelo ID do evento que deseja reprocessar)
-- SELECT * FROM reprocess_failed_webhook_event('4d897617-6c6f-48de-85d8-2c2387695522');

-- 3. Verificar se o evento foi processado com sucesso (substitua o ID pelo ID do evento que foi reprocessado)
-- SELECT id, event_type, payment_id, processed, error_message, created_at, processed_at
-- FROM asaas_webhook_events
-- WHERE id = '4d897617-6c6f-48de-85d8-2c2387695522';

-- 4. Reprocessar todos os eventos nu00e3o processados (use com cuidado)
/*
DO $$
DECLARE
    event_record RECORD;
    result JSONB;
BEGIN
    FOR event_record IN 
        SELECT id 
        FROM asaas_webhook_events 
        WHERE processed = false 
        ORDER BY created_at ASC
        LIMIT 10
    LOOP
        RAISE NOTICE 'Reprocessando evento %', event_record.id;
        result := reprocess_failed_webhook_event(event_record.id);
        RAISE NOTICE 'Resultado: %', result;
    END LOOP;
END;
$$;
*/
