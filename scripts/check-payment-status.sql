-- Verificar o status dos pagamentos

-- 1. Verificar os u00faltimos pagamentos processados
SELECT 
    ap.id,
    ap.asaas_id,
    ap.status,
    ap.billing_type,
    ap.created_at,
    ap.updated_at,
    s.id as subscription_id,
    s.status as subscription_status,
    s.payment_status
FROM asaas_payments ap
JOIN subscriptions s ON ap.subscription_id = s.id
ORDER BY ap.updated_at DESC
LIMIT 10;

-- 2. Verificar pagamentos que foram atualizados por webhooks
SELECT 
    ap.id,
    ap.asaas_id,
    ap.status,
    ap.updated_at,
    awe.event_type,
    awe.processed,
    awe.processed_at
FROM asaas_payments ap
JOIN asaas_webhook_events awe ON ap.asaas_id = awe.payment_id
ORDER BY awe.created_at DESC
LIMIT 10;

-- 3. Verificar histu00f3rico de assinaturas
SELECT 
    sh.id,
    sh.subscription_id,
    sh.status,
    sh.payment_status,
    sh.start_date,
    sh.end_date,
    sh.created_at,
    sh.updated_at
FROM subscription_history sh
ORDER BY sh.created_at DESC
LIMIT 10;
