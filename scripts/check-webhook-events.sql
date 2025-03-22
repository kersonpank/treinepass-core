-- Consulta para verificar os eventos de webhook mais recentes
SELECT 
    id, 
    event_id, 
    event_type, 
    payment_id, 
    processed, 
    processed_at, 
    error_message, 
    retry_count,
    created_at
FROM asaas_webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Consulta para verificar eventos não processados
SELECT 
    id, 
    event_id, 
    event_type, 
    payment_id, 
    error_message, 
    retry_count,
    created_at
FROM asaas_webhook_events 
WHERE processed = false
ORDER BY created_at DESC 
LIMIT 10;
