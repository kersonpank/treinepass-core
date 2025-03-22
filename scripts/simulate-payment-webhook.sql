-- Script para simular um webhook de pagamento do Asaas

-- Primeiro, vamos selecionar uma assinatura para atualizar
SELECT 
  id, 
  user_id, 
  plan_id, 
  status, 
  payment_status, 
  start_date, 
  end_date
FROM 
  user_plan_subscriptions
WHERE 
  user_id = '2ba45899-b5c7-4089-aeac-74dedcb2bfb8'
  AND status = 'pending'
LIMIT 1;

-- Agora vamos simular o processamento de um webhook de pagamento
-- Substitua o UUID abaixo pelo ID da assinatura que você quer atualizar
DO $$
DECLARE
  v_subscription_id UUID := 'bd2b4d40-7abd-4623-b4a4-26644e2f68fd'; -- Substitua pelo ID real da assinatura
  v_payload JSONB;
BEGIN
  -- Criar um payload simulando um evento de pagamento confirmado
  v_payload := jsonb_build_object(
    'event', 'PAYMENT_CONFIRMED',
    'payment', jsonb_build_object(
      'id', 'pay_' || md5(random()::text),
      'status', 'CONFIRMED',
      'externalReference', v_subscription_id,
      'subscription', 'sub_' || md5(random()::text)
    )
  );
  
  -- Processar o webhook simulado
  PERFORM process_asaas_webhook(v_payload);
  
  -- Verificar o resultado
  RAISE NOTICE 'Webhook processado para a assinatura %', v_subscription_id;
END;
$$;

-- Verificar se a assinatura foi atualizada
SELECT 
  id, 
  user_id, 
  plan_id, 
  status, 
  payment_status, 
  start_date, 
  end_date
FROM 
  user_plan_subscriptions
WHERE 
  id = 'bd2b4d40-7abd-4623-b4a4-26644e2f68fd'; -- Substitua pelo mesmo ID usado acima

-- Testar a função check_active_subscription após a atualização
SELECT check_active_subscription('2ba45899-b5c7-4089-aeac-74dedcb2bfb8') AS has_active_subscription;

-- Verificar eventos de webhook processados
SELECT 
  id, 
  event_id, 
  event_type, 
  payment_id, 
  subscription_id, 
  processed, 
  processed_at, 
  error_message
FROM 
  asaas_webhook_events
ORDER BY 
  created_at DESC
LIMIT 5;
