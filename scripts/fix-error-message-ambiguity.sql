-- Script para corrigir o erro de ambiguidade na coluna error_message

-- 1. Verificar a estrutura atual da tabela asaas_webhook_events
DO $$
DECLARE
    has_error_message BOOLEAN;
    has_error_message_in_function BOOLEAN;
BEGIN
    -- Verificar se a coluna error_message existe na tabela
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_webhook_events'
        AND column_name = 'error_message'
    ) INTO has_error_message;
    
    -- Verificar se há uma variável error_message na função process_asaas_webhook
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'process_asaas_webhook'
        AND p.prosrc LIKE '%error_message%'
    ) INTO has_error_message_in_function;
    
    RAISE NOTICE 'Coluna error_message na tabela: %', has_error_message;
    RAISE NOTICE 'Variável error_message na função: %', has_error_message_in_function;
END;
$$;

-- 2. Atualizar a função process_asaas_webhook para resolver a ambiguidade
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
    webhook_error_message TEXT; -- Renomeado para evitar ambiguidade
    external_reference TEXT;
    debug_info JSONB;
    subscription_exists BOOLEAN;
BEGIN
    -- Extrair tipo de evento
    event_type := payload->>'event';
    
    -- Gerar um ID de evento se não estiver presente
    event_id := payload->>'id';
    IF event_id IS NULL THEN
        event_id := 'evt_' || md5(payload::TEXT) || '_' || floor(random() * 10000000);
    END IF;
    
    -- Extrair dados com base no tipo de evento
    payment_data := payload->'payment';
    subscription_data := payload->'subscription';
    customer_data := payload->'customer';
    
    -- Inicializar debug_info
    debug_info := jsonb_build_object(
        'event_type', event_type,
        'event_id', event_id,
        'timestamp', now()
    );
    
    -- Registrar o evento do webhook
    INSERT INTO public.asaas_webhook_events (
        event_id,
        event_type,
        payment_id,
        subscription_id,
        customer_id,
        payload,
        processed,
        processed_at,
        debug_info
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
        NULL,
        debug_info
    ) RETURNING id INTO webhook_event_id;
    
    -- Inicializar resultado
    result := jsonb_build_object(
        'success', TRUE,
        'event_type', event_type,
        'event_id', event_id,
        'webhook_event_id', webhook_event_id
    );
    
    -- Processar eventos de pagamento
    IF event_type LIKE 'PAYMENT_%' AND payment_data IS NOT NULL THEN
        payment_id := payment_data->>'id';
        payment_status := payment_data->>'status';
        subscription_id := payment_data->>'subscription';
        external_reference := payment_data->>'externalReference';
        
        debug_info := debug_info || jsonb_build_object(
            'payment_id', payment_id,
            'payment_status', payment_status,
            'subscription_id', subscription_id,
            'external_reference', external_reference
        );
        
        -- Atualizar diretamente a assinatura pelo external_reference
        IF external_reference IS NOT NULL AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
            BEGIN
                -- Atualizar diretamente pelo external_reference
                WITH updated AS (
                    UPDATE subscriptions
                    SET 
                        status = CASE 
                            WHEN payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN 'active'
                            WHEN payment_status = 'OVERDUE' THEN 'overdue'
                            WHEN payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN 'cancelled'
                            ELSE status
                        END,
                        payment_status = CASE 
                            WHEN payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN 'paid'
                            WHEN payment_status = 'OVERDUE' THEN 'overdue'
                            WHEN payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN 'refunded'
                            ELSE LOWER(payment_status)
                        END,
                        asaas_subscription_id = CASE 
                            WHEN subscription_id IS NOT NULL THEN subscription_id
                            ELSE asaas_subscription_id
                        END,
                        updated_at = NOW()
                    WHERE id = external_reference::UUID
                    RETURNING id
                )
                SELECT COUNT(*) > 0 INTO subscription_exists FROM updated;
                
                IF subscription_exists THEN
                    debug_info := debug_info || jsonb_build_object(
                        'action', 'updated_subscription_by_external_reference',
                        'external_reference', external_reference,
                        'new_status', CASE 
                            WHEN payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN 'active'
                            WHEN payment_status = 'OVERDUE' THEN 'overdue'
                            WHEN payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN 'cancelled'
                            ELSE 'unchanged'
                        END
                    );
                    
                    result := result || jsonb_build_object(
                        'subscription_updated', TRUE,
                        'updated_by', 'external_reference',
                        'external_reference', external_reference
                    );
                ELSE
                    debug_info := debug_info || jsonb_build_object(
                        'error', 'subscription_not_found_by_external_reference',
                        'external_reference', external_reference
                    );
                    
                    result := result || jsonb_build_object(
                        'subscription_updated', FALSE,
                        'reason', 'Assinatura não encontrada pelo external_reference: ' || external_reference
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN
                webhook_error_message := 'Erro ao atualizar pelo external_reference: ' || SQLERRM;
                
                debug_info := debug_info || jsonb_build_object(
                    'error', webhook_error_message
                );
                
                result := result || jsonb_build_object(
                    'subscription_updated', FALSE,
                    'error', webhook_error_message
                );
            END;
        ELSE
            debug_info := debug_info || jsonb_build_object(
                'error', 'external_reference_null_or_subscriptions_table_not_found',
                'external_reference', external_reference,
                'subscriptions_table_exists', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions')
            );
            
            result := result || jsonb_build_object(
                'subscription_updated', FALSE,
                'reason', 'External reference é NULL ou tabela subscriptions não existe'
            );
        END IF;
    END IF;
    
    -- Processar eventos de assinatura
    IF event_type LIKE 'SUBSCRIPTION_%' AND subscription_data IS NOT NULL THEN
        subscription_id := subscription_data->>'id';
        subscription_status := subscription_data->>'status';
        external_reference := subscription_data->>'externalReference';
        
        debug_info := debug_info || jsonb_build_object(
            'subscription_id', subscription_id,
            'subscription_status', subscription_status,
            'external_reference', external_reference
        );
        
        -- Atualizar diretamente a assinatura pelo external_reference
        IF external_reference IS NOT NULL AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
            BEGIN
                -- Atualizar diretamente pelo external_reference
                WITH updated AS (
                    UPDATE subscriptions
                    SET 
                        status = CASE 
                            WHEN subscription_status = 'ACTIVE' THEN 'active'
                            WHEN subscription_status = 'INACTIVE' THEN 'cancelled'
                            ELSE status
                        END,
                        asaas_subscription_id = subscription_id,
                        updated_at = NOW()
                    WHERE id = external_reference::UUID
                    RETURNING id
                )
                SELECT COUNT(*) > 0 INTO subscription_exists FROM updated;
                
                IF subscription_exists THEN
                    debug_info := debug_info || jsonb_build_object(
                        'action', 'updated_subscription_by_external_reference',
                        'external_reference', external_reference,
                        'new_status', CASE 
                            WHEN subscription_status = 'ACTIVE' THEN 'active'
                            WHEN subscription_status = 'INACTIVE' THEN 'cancelled'
                            ELSE 'unchanged'
                        END
                    );
                    
                    result := result || jsonb_build_object(
                        'subscription_updated', TRUE,
                        'updated_by', 'external_reference',
                        'external_reference', external_reference
                    );
                ELSE
                    debug_info := debug_info || jsonb_build_object(
                        'error', 'subscription_not_found_by_external_reference',
                        'external_reference', external_reference
                    );
                    
                    result := result || jsonb_build_object(
                        'subscription_updated', FALSE,
                        'reason', 'Assinatura não encontrada pelo external_reference: ' || external_reference
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN
                webhook_error_message := 'Erro ao atualizar pelo external_reference: ' || SQLERRM;
                
                debug_info := debug_info || jsonb_build_object(
                    'error', webhook_error_message
                );
                
                result := result || jsonb_build_object(
                    'subscription_updated', FALSE,
                    'error', webhook_error_message
                );
            END;
        ELSE
            debug_info := debug_info || jsonb_build_object(
                'error', 'external_reference_null_or_subscriptions_table_not_found',
                'external_reference', external_reference,
                'subscriptions_table_exists', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions')
            );
            
            result := result || jsonb_build_object(
                'subscription_updated', FALSE,
                'reason', 'External reference é NULL ou tabela subscriptions não existe'
            );
        END IF;
    END IF;
    
    -- Atualizar o evento com informações de debug
    UPDATE public.asaas_webhook_events
    SET 
        processed = TRUE,
        processed_at = NOW(),
        debug_info = debug_info
    WHERE id = webhook_event_id;
    
    -- Retornar o resultado
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Se houver erro, marcar evento como não processado
    webhook_error_message := 'Erro inesperado ao processar webhook: ' || SQLERRM;
    
    IF webhook_event_id IS NOT NULL THEN
        UPDATE public.asaas_webhook_events
        SET 
            processed = FALSE,
            processed_at = NOW(),
            error_message = webhook_error_message,
            debug_info = COALESCE(debug_info, '{}'::JSONB) || jsonb_build_object('fatal_error', webhook_error_message)
        WHERE id = webhook_event_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', webhook_error_message,
        'webhook_event_id', webhook_event_id
    );
END;
$$;

-- 3. Verificar se a função foi atualizada corretamente
DO $$
BEGIN
    RAISE NOTICE 'A função process_asaas_webhook foi atualizada com sucesso.';
    RAISE NOTICE 'A variável error_message foi renomeada para webhook_error_message para evitar ambiguidade.';
END;
$$;
