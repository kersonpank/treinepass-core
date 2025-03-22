-- Script para monitorar eventos de webhook

-- 1. Resumo de eventos por tipo
SELECT 
    event_type, 
    COUNT(*) as total_events,
    SUM(CASE WHEN processed = true THEN 1 ELSE 0 END) as processed_events,
    SUM(CASE WHEN processed = false THEN 1 ELSE 0 END) as failed_events,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM asaas_webhook_events
GROUP BY event_type
ORDER BY total_events DESC;

-- 2. Eventos com erro
SELECT 
    id,
    event_type,
    payment_id,
    error_message,
    retry_count,
    created_at
FROM asaas_webhook_events
WHERE processed = false
ORDER BY created_at DESC;

-- 3. Eventos mais recentes
SELECT 
    id,
    event_type,
    payment_id,
    processed,
    processed_at,
    created_at,
    updated_at
FROM asaas_webhook_events
ORDER BY created_at DESC
LIMIT 20;

-- 4. Tempo mu00e9dio de processamento
SELECT 
    event_type,
    COUNT(*) as total_events,
    AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
FROM asaas_webhook_events
WHERE processed = true AND processed_at IS NOT NULL
GROUP BY event_type
ORDER BY avg_processing_time_seconds DESC;
