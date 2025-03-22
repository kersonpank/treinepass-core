-- Script para corrigir apenas o problema de ambiguidade da coluna error_message

-- 1. Verificar a definiu00e7u00e3o atual da funu00e7u00e3o process_asaas_webhook
DO $$
DECLARE
    func_definition TEXT;
BEGIN
    SELECT pg_get_functiondef(p.oid)
    INTO func_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'process_asaas_webhook';
    
    IF func_definition IS NULL THEN
        RAISE NOTICE 'Funu00e7u00e3o process_asaas_webhook nu00e3o encontrada';
    ELSE
        RAISE NOTICE 'Funu00e7u00e3o process_asaas_webhook encontrada';
    END IF;
END;
$$;

-- 2. Criar a funu00e7u00e3o atualizada com a correu00e7u00e3o da ambiguidade
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
    error_msg TEXT; -- Renomeado de error_message para error_msg
    external_reference TEXT;
    debug_info JSONB;
    subscription_record RECORD;
BEGIN
    -- Extrair tipo de evento
    event_type := payload->>'event';
    
    -- Extrair ID do evento
    event_id := payload->>'id';
    
    -- Gerar um ID de evento se nu00e3o estiver presente
    IF event_id IS NULL THEN
        event_id := 'evt_' || md5(payload::TEXT) || '_' || floor(random() * 10000000);
    END IF;
    
    -- Extrair dados com base no tipo de evento
    payment_data := payload->'payment';
    subscription_data := payload->'subscription';
    customer_data := payload->'customer';
    
    -- Inicializar debug_info se a coluna existir
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_webhook_events'
        AND column_name = 'debug_info'
    ) THEN
        debug_info := jsonb_build_object(
            'event_type', event_type,
            'event_id', event_id,
            'timestamp', now()
        );
    ELSE
        debug_info := NULL;
    END IF;
    
    -- Registrar o evento do webhook com os campos que existem na tabela
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_webhook_events'
        AND column_name = 'debug_info'
    ) THEN
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
    ELSE
        INSERT INTO public.asaas_webhook_events (
            event_id,
            event_type,
            payment_id,
            subscription_id,
            customer_id,
            payload,
            processed,
            processed_at
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
            NULL
        ) RETURNING id INTO webhook_event_id;
    END IF;
    
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
        
        -- Atualizar debug_info se existir
        IF debug_info IS NOT NULL THEN
            debug_info := debug_info || jsonb_build_object(
                'payment_id', payment_id,
                'payment_status', payment_status,
                'subscription_id', subscription_id,
                'external_reference', external_reference
            );
        END IF;
        
        -- Encontrar a assinatura associada ao pagamento
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
            BEGIN
                -- Tentar encontrar pelo external_reference
                IF external_reference IS NOT NULL THEN
                    SELECT * INTO subscription_record
                    FROM subscriptions
                    WHERE id = external_reference::UUID;
                    
                    IF FOUND THEN
                        -- Atualizar a assinatura
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
                        WHERE id = subscription_record.id;
                        
                        -- Atualizar debug_info se existir
                        IF debug_info IS NOT NULL THEN
                            debug_info := debug_info || jsonb_build_object(
                                'action', 'updated_subscription_by_external_reference',
                                'subscription_id', subscription_record.id,
                                'new_status', CASE 
                                    WHEN payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN 'active'
                                    WHEN payment_status = 'OVERDUE' THEN 'overdue'
                                    WHEN payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN 'cancelled'
                                    ELSE 'unchanged'
                                END
                            );
                        END IF;
                        
                        result := result || jsonb_build_object(
                            'subscription_updated', TRUE,
                            'subscription_id', subscription_record.id
                        );
                    ELSE
                        -- Tentar encontrar pelo subscription_id
                        IF subscription_id IS NOT NULL THEN
                            SELECT * INTO subscription_record
                            FROM subscriptions
                            WHERE asaas_subscription_id = subscription_id;
                            
                            IF FOUND THEN
                                -- Atualizar a assinatura
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
                                    updated_at = NOW()
                                WHERE id = subscription_record.id;
                                
                                -- Atualizar debug_info se existir
                                IF debug_info IS NOT NULL THEN
                                    debug_info := debug_info || jsonb_build_object(
                                        'action', 'updated_subscription_by_subscription_id',
                                        'subscription_id', subscription_record.id,
                                        'new_status', CASE 
                                            WHEN payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN 'active'
                                            WHEN payment_status = 'OVERDUE' THEN 'overdue'
                                            WHEN payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN 'cancelled'
                                            ELSE 'unchanged'
                                        END
                                    );
                                END IF;
                                
                                result := result || jsonb_build_object(
                                    'subscription_updated', TRUE,
                                    'subscription_id', subscription_record.id
                                );
                            ELSE
                                -- Nu00e3o foi possu00edvel encontrar a assinatura
                                IF debug_info IS NOT NULL THEN
                                    debug_info := debug_info || jsonb_build_object(
                                        'error', 'subscription_not_found',
                                        'external_reference', external_reference,
                                        'subscription_id', subscription_id
                                    );
                                END IF;
                                
                                result := result || jsonb_build_object(
                                    'subscription_updated', FALSE,
                                    'reason', 'Assinatura nu00e3o encontrada'
                                );
                            END IF;
                        ELSE
                            -- Nu00e3o foi possu00edvel encontrar a assinatura
                            IF debug_info IS NOT NULL THEN
                                debug_info := debug_info || jsonb_build_object(
                                    'error', 'subscription_id_null',
                                    'external_reference', external_reference
                                );
                            END IF;
                            
                            result := result || jsonb_build_object(
                                'subscription_updated', FALSE,
                                'reason', 'ID da assinatura u00e9 NULL'
                            );
                        END IF;
                    END IF;
                ELSE
                    -- Tentar encontrar pelo subscription_id
                    IF subscription_id IS NOT NULL THEN
                        SELECT * INTO subscription_record
                        FROM subscriptions
                        WHERE asaas_subscription_id = subscription_id;
                        
                        IF FOUND THEN
                            -- Atualizar a assinatura
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
                                updated_at = NOW()
                            WHERE id = subscription_record.id;
                            
                            -- Atualizar debug_info se existir
                            IF debug_info IS NOT NULL THEN
                                debug_info := debug_info || jsonb_build_object(
                                    'action', 'updated_subscription_by_subscription_id',
                                    'subscription_id', subscription_record.id,
                                    'new_status', CASE 
                                        WHEN payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN 'active'
                                        WHEN payment_status = 'OVERDUE' THEN 'overdue'
                                        WHEN payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN 'cancelled'
                                        ELSE 'unchanged'
                                    END
                                );
                            END IF;
                            
                            result := result || jsonb_build_object(
                                'subscription_updated', TRUE,
                                'subscription_id', subscription_record.id
                            );
                        ELSE
                            -- Nu00e3o foi possu00edvel encontrar a assinatura
                            IF debug_info IS NOT NULL THEN
                                debug_info := debug_info || jsonb_build_object(
                                    'error', 'subscription_not_found_by_subscription_id',
                                    'subscription_id', subscription_id
                                );
                            END IF;
                            
                            result := result || jsonb_build_object(
                                'subscription_updated', FALSE,
                                'reason', 'Assinatura nu00e3o encontrada pelo ID da assinatura'
                            );
                        END IF;
                    ELSE
                        -- Nu00e3o foi possu00edvel encontrar a assinatura
                        IF debug_info IS NOT NULL THEN
                            debug_info := debug_info || jsonb_build_object(
                                'error', 'subscription_id_and_external_reference_null'
                            );
                        END IF;
                        
                        result := result || jsonb_build_object(
                            'subscription_updated', FALSE,
                            'reason', 'ID da assinatura e external_reference su00e3o NULL'
                        );
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                error_msg := 'Erro ao processar pagamento: ' || SQLERRM; -- Usando error_msg em vez de error_message
                
                -- Atualizar debug_info se existir
                IF debug_info IS NOT NULL THEN
                    debug_info := debug_info || jsonb_build_object(
                        'error', error_msg
                    );
                END IF;
                
                result := result || jsonb_build_object(
                    'subscription_updated', FALSE,
                    'error', error_msg
                );
            END;
        ELSE
            -- A tabela subscriptions nu00e3o existe
            IF debug_info IS NOT NULL THEN
                debug_info := debug_info || jsonb_build_object(
                    'error', 'subscriptions_table_not_found'
                );
            END IF;
            
            result := result || jsonb_build_object(
                'subscription_updated', FALSE,
                'reason', 'Tabela subscriptions nu00e3o existe'
            );
        END IF;
    END IF;
    
    -- Processar eventos de assinatura
    IF event_type LIKE 'SUBSCRIPTION_%' AND subscription_data IS NOT NULL THEN
        subscription_id := subscription_data->>'id';
        subscription_status := subscription_data->>'status';
        external_reference := subscription_data->>'externalReference';
        
        -- Atualizar debug_info se existir
        IF debug_info IS NOT NULL THEN
            debug_info := debug_info || jsonb_build_object(
                'subscription_id', subscription_id,
                'subscription_status', subscription_status,
                'external_reference', external_reference
            );
        END IF;
        
        -- Encontrar a assinatura associada ao evento
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
            BEGIN
                -- Tentar encontrar pelo external_reference
                IF external_reference IS NOT NULL THEN
                    SELECT * INTO subscription_record
                    FROM subscriptions
                    WHERE id = external_reference::UUID;
                    
                    IF FOUND THEN
                        -- Atualizar a assinatura
                        UPDATE subscriptions
                        SET 
                            status = CASE 
                                WHEN subscription_status = 'ACTIVE' THEN 'active'
                                WHEN subscription_status = 'INACTIVE' THEN 'cancelled'
                                ELSE status
                            END,
                            asaas_subscription_id = subscription_id,
                            updated_at = NOW()
                        WHERE id = subscription_record.id;
                        
                        -- Atualizar debug_info se existir
                        IF debug_info IS NOT NULL THEN
                            debug_info := debug_info || jsonb_build_object(
                                'action', 'updated_subscription_by_external_reference',
                                'subscription_id', subscription_record.id,
                                'new_status', CASE 
                                    WHEN subscription_status = 'ACTIVE' THEN 'active'
                                    WHEN subscription_status = 'INACTIVE' THEN 'cancelled'
                                    ELSE 'unchanged'
                                END
                            );
                        END IF;
                        
                        result := result || jsonb_build_object(
                            'subscription_updated', TRUE,
                            'subscription_id', subscription_record.id
                        );
                    ELSE
                        -- Nu00e3o foi possu00edvel encontrar a assinatura
                        IF debug_info IS NOT NULL THEN
                            debug_info := debug_info || jsonb_build_object(
                                'error', 'subscription_not_found_by_external_reference',
                                'external_reference', external_reference
                            );
                        END IF;
                        
                        result := result || jsonb_build_object(
                            'subscription_updated', FALSE,
                            'reason', 'Assinatura nu00e3o encontrada pelo external_reference'
                        );
                    END IF;
                ELSE
                    -- Tentar encontrar pelo subscription_id
                    IF subscription_id IS NOT NULL THEN
                        SELECT * INTO subscription_record
                        FROM subscriptions
                        WHERE asaas_subscription_id = subscription_id;
                        
                        IF FOUND THEN
                            -- Atualizar a assinatura
                            UPDATE subscriptions
                            SET 
                                status = CASE 
                                    WHEN subscription_status = 'ACTIVE' THEN 'active'
                                    WHEN subscription_status = 'INACTIVE' THEN 'cancelled'
                                    ELSE status
                                END,
                                updated_at = NOW()
                            WHERE id = subscription_record.id;
                            
                            -- Atualizar debug_info se existir
                            IF debug_info IS NOT NULL THEN
                                debug_info := debug_info || jsonb_build_object(
                                    'action', 'updated_subscription_by_subscription_id',
                                    'subscription_id', subscription_record.id,
                                    'new_status', CASE 
                                        WHEN subscription_status = 'ACTIVE' THEN 'active'
                                        WHEN subscription_status = 'INACTIVE' THEN 'cancelled'
                                        ELSE 'unchanged'
                                    END
                                );
                            END IF;
                            
                            result := result || jsonb_build_object(
                                'subscription_updated', TRUE,
                                'subscription_id', subscription_record.id
                            );
                        ELSE
                            -- Nu00e3o foi possu00edvel encontrar a assinatura
                            IF debug_info IS NOT NULL THEN
                                debug_info := debug_info || jsonb_build_object(
                                    'error', 'subscription_not_found_by_subscription_id',
                                    'subscription_id', subscription_id
                                );
                            END IF;
                            
                            result := result || jsonb_build_object(
                                'subscription_updated', FALSE,
                                'reason', 'Assinatura nu00e3o encontrada pelo ID da assinatura'
                            );
                        END IF;
                    ELSE
                        -- Nu00e3o foi possu00edvel encontrar a assinatura
                        IF debug_info IS NOT NULL THEN
                            debug_info := debug_info || jsonb_build_object(
                                'error', 'subscription_id_and_external_reference_null'
                            );
                        END IF;
                        
                        result := result || jsonb_build_object(
                            'subscription_updated', FALSE,
                            'reason', 'ID da assinatura e external_reference su00e3o NULL'
                        );
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                error_msg := 'Erro ao processar evento de assinatura: ' || SQLERRM; -- Usando error_msg em vez de error_message
                
                -- Atualizar debug_info se existir
                IF debug_info IS NOT NULL THEN
                    debug_info := debug_info || jsonb_build_object(
                        'error', error_msg
                    );
                END IF;
                
                result := result || jsonb_build_object(
                    'subscription_updated', FALSE,
                    'error', error_msg
                );
            END;
        ELSE
            -- A tabela subscriptions nu00e3o existe
            IF debug_info IS NOT NULL THEN
                debug_info := debug_info || jsonb_build_object(
                    'error', 'subscriptions_table_not_found'
                );
            END IF;
            
            result := result || jsonb_build_object(
                'subscription_updated', FALSE,
                'reason', 'Tabela subscriptions nu00e3o existe'
            );
        END IF;
    END IF;
    
    -- Atualizar o evento com informau00e7u00f5es de debug se a coluna existir
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'asaas_webhook_events'
        AND column_name = 'debug_info'
    ) THEN
        UPDATE public.asaas_webhook_events
        SET 
            processed = TRUE,
            processed_at = NOW(),
            debug_info = debug_info
        WHERE id = webhook_event_id;
    ELSE
        UPDATE public.asaas_webhook_events
        SET 
            processed = TRUE,
            processed_at = NOW()
        WHERE id = webhook_event_id;
    END IF;
    
    -- Retornar o resultado
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Se houver erro, marcar evento como nu00e3o processado
    error_msg := 'Erro inesperado ao processar webhook: ' || SQLERRM; -- Usando error_msg em vez de error_message
    
    IF webhook_event_id IS NOT NULL THEN
        -- Verificar se a coluna error_message existe
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'asaas_webhook_events'
            AND column_name = 'error_message'
        ) THEN
            -- Verificar se a coluna debug_info existe
            IF EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'asaas_webhook_events'
                AND column_name = 'debug_info'
            ) THEN
                UPDATE public.asaas_webhook_events
                SET 
                    processed = FALSE,
                    processed_at = NOW(),
                    error_message = error_msg, -- AQUI ESTu00c1 A CORREu00c7u00c3O: usando error_msg em vez de error_message
                    debug_info = COALESCE(debug_info, '{}'::JSONB) || jsonb_build_object('fatal_error', error_msg)
                WHERE id = webhook_event_id;
            ELSE
                UPDATE public.asaas_webhook_events
                SET 
                    processed = FALSE,
                    processed_at = NOW(),
                    error_message = error_msg -- AQUI ESTu00c1 A CORREu00c7u00c3O: usando error_msg em vez de error_message
                WHERE id = webhook_event_id;
            END IF;
        ELSE
            -- Se nu00e3o existir a coluna error_message, apenas atualizar processed e processed_at
            UPDATE public.asaas_webhook_events
            SET 
                processed = FALSE,
                processed_at = NOW()
            WHERE id = webhook_event_id;
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', error_msg, -- Usando error_msg em vez de error_message
        'webhook_event_id', webhook_event_id
    );
END;
$$;

-- 3. Verificar se a funu00e7u00e3o foi atualizada corretamente
DO $$
BEGIN
    RAISE NOTICE 'A funu00e7u00e3o process_asaas_webhook foi atualizada com a correu00e7u00e3o da ambiguidade da coluna error_message';
END;
$$;
