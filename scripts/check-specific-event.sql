-- Verificar um evento especu00edfico
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
WHERE id = '9ef6bbfc-cc0d-4742-8a98-7129fa191ff8';
