-- Script para limpar eventos antigos ou duplicados

-- 1. Identificar eventos duplicados (mesmo event_id)
SELECT 
    event_id, 
    COUNT(*) as count,
    MIN(id) as first_id,
    array_agg(id) as all_ids
FROM asaas_webhook_events
GROUP BY event_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Remover eventos duplicados (manter apenas o primeiro)
-- DESCOMENTE PARA EXECUTAR
/*
WITH duplicates AS (
    SELECT 
        event_id, 
        MIN(id) as first_id,
        array_agg(id) as all_ids
    FROM asaas_webhook_events
    GROUP BY event_id
    HAVING COUNT(*) > 1
)
DELETE FROM asaas_webhook_events
WHERE id IN (
    SELECT unnest(all_ids) 
    FROM duplicates 
    WHERE unnest(all_ids) != first_id
);
*/

-- 3. Identificar eventos antigos (mais de 30 dias)
SELECT 
    COUNT(*) as total_old_events
FROM asaas_webhook_events
WHERE created_at < NOW() - INTERVAL '30 days';

-- 4. Remover eventos antigos (mais de 30 dias)
-- DESCOMENTE PARA EXECUTAR
/*
DELETE FROM asaas_webhook_events
WHERE created_at < NOW() - INTERVAL '30 days';
*/

-- 5. Identificar eventos com erro que ju00e1 foram reprocessados
SELECT 
    id,
    event_type,
    payment_id,
    error_message,
    retry_count,
    created_at
FROM asaas_webhook_events
WHERE processed = false AND retry_count > 0
ORDER BY created_at DESC;

-- 6. Remover eventos com erro que ju00e1 foram reprocessados mais de 3 vezes
-- DESCOMENTE PARA EXECUTAR
/*
DELETE FROM asaas_webhook_events
WHERE processed = false AND retry_count > 3;
*/

-- 7. Verificar o tamanho da tabela
SELECT 
    pg_size_pretty(pg_total_relation_size('asaas_webhook_events')) as table_size;

-- 8. Resumo apu00f3s a limpeza
SELECT 
    COUNT(*) as total_events,
    SUM(CASE WHEN processed = true THEN 1 ELSE 0 END) as processed_events,
    SUM(CASE WHEN processed = false THEN 1 ELSE 0 END) as failed_events,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM asaas_webhook_events;
