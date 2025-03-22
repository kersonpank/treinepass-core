-- Script para corrigir o problema do event_id na função process_asaas_webhook

-- 1. Verificar se a coluna event_id é NOT NULL
DO $$
DECLARE
    is_nullable TEXT;
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_webhook_events') THEN
        RAISE EXCEPTION 'A tabela asaas_webhook_events não existe.';
    END IF;
    
    -- Verificar se a coluna event_id existe
    SELECT is_nullable INTO is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'asaas_webhook_events' 
    AND column_name = 'event_id';
    
    IF is_nullable IS NULL THEN
        RAISE NOTICE 'A coluna event_id não existe na tabela asaas_webhook_events. Adicionando coluna...';
        ALTER TABLE public.asaas_webhook_events ADD COLUMN event_id TEXT;
    ELSIF is_nullable = 'NO' THEN
        RAISE NOTICE 'A coluna event_id é NOT NULL. Alterando para aceitar NULL temporariamente...';
        ALTER TABLE public.asaas_webhook_events ALTER COLUMN event_id DROP NOT NULL;
    ELSE
        RAISE NOTICE 'A coluna event_id já aceita valores NULL.';
    END IF;
END;
$$;

-- 2. Atualizar a função process_asaas_webhook para gerar um event_id quando não estiver presente
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
    log_message TEXT;
    error_message TEXT;
BEGIN
    -- Extrair tipo de evento
    event_type := payload->>'event';
    
    -- Log do evento recebido
    RAISE NOTICE 'Processando webhook do Asaas: %', payload;
    
    -- Gerar um ID de evento se não estiver presente
    event_id := payload->>'id';
    IF event_id IS NULL THEN
        event_id := 'evt_' || md5(payload::TEXT) || '_' || floor(random() * 10000000);
        RAISE NOTICE 'ID de evento gerado: %', event_id;
    END IF;
    
    -- Extrair dados com base no tipo de evento
    payment_data := payload->'payment';
    subscription_data := payload->'subscription';
    customer_data := payload->'customer';
    
    -- Registrar o evento do webhook
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
    
    -- Inicializar resultado
    result := jsonb_build_object(
        'success', TRUE,
        'event_type', event_type,
        'event_id', event_id,
        'message', 'Evento registrado com sucesso'
    );
    
    -- Processar eventos de pagamento
    IF event_type LIKE 'PAYMENT_%' AND payment_data IS NOT NULL THEN
        payment_id := payment_data->>'id';
        payment_status := payment_data->>'status';
        
        -- Buscar o user_id e plan_id com base no payment_id
        BEGIN
            -- Verificar se estamos usando benefit_plans
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') THEN
                SELECT bp.id, bp.user_id INTO plan_id, user_id
                FROM benefit_plans bp
                WHERE bp.payment_id = payment_id;
                
                IF plan_id IS NULL THEN
                    -- Tentar encontrar por external_reference
                    SELECT bp.id, bp.user_id INTO plan_id, user_id
                    FROM benefit_plans bp
                    WHERE bp.external_reference = payment_data->>'externalReference';
                END IF;
                
                -- Atualizar o plano com base no status do pagamento
                IF plan_id IS NOT NULL THEN
                    IF payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN
                        -- Pagamento confirmado, ativar o plano
                        UPDATE benefit_plans
                        SET status = 'active',
                            updated_at = NOW(),
                            payment_status = payment_status
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('plan_updated', TRUE, 'new_status', 'active');
                    ELSIF payment_status = 'OVERDUE' THEN
                        -- Pagamento atrasado, marcar o plano como atrasado
                        UPDATE benefit_plans
                        SET status = 'overdue',
                            updated_at = NOW(),
                            payment_status = payment_status
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('plan_updated', TRUE, 'new_status', 'overdue');
                    ELSIF payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN
                        -- Pagamento reembolsado ou excluído, cancelar o plano
                        UPDATE benefit_plans
                        SET status = 'cancelled',
                            updated_at = NOW(),
                            payment_status = payment_status
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('plan_updated', TRUE, 'new_status', 'cancelled');
                    ELSE
                        -- Outro status de pagamento, apenas atualizar o payment_status
                        UPDATE benefit_plans
                        SET updated_at = NOW(),
                            payment_status = payment_status
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('plan_updated', TRUE, 'payment_status_updated', TRUE);
                    END IF;
                ELSE
                    -- Nenhum plano encontrado para este pagamento
                    result := result || jsonb_build_object(
                        'plan_updated', FALSE,
                        'reason', 'Nenhum plano encontrado para o ID de pagamento: ' || payment_id
                    );
                END IF;
            -- Verificar se estamos usando a tabela subscriptions
            ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
                -- Lógica para tabela subscriptions
                -- Buscar assinatura associada ao pagamento
                SELECT s.id, s.user_id INTO plan_id, user_id
                FROM subscriptions s
                JOIN asaas_payments ap ON s.id = ap.subscription_id
                WHERE ap.asaas_id = payment_id;
                
                IF plan_id IS NOT NULL THEN
                    IF payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN
                        -- Pagamento confirmado, ativar a assinatura
                        UPDATE subscriptions
                        SET status = 'active',
                            payment_status = 'paid',
                            updated_at = NOW()
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('subscription_updated', TRUE, 'new_status', 'active');
                    ELSIF payment_status = 'OVERDUE' THEN
                        -- Pagamento atrasado, marcar a assinatura como atrasada
                        UPDATE subscriptions
                        SET status = 'overdue',
                            payment_status = 'overdue',
                            updated_at = NOW()
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('subscription_updated', TRUE, 'new_status', 'overdue');
                    ELSIF payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN
                        -- Pagamento reembolsado ou excluído, cancelar a assinatura
                        UPDATE subscriptions
                        SET status = 'cancelled',
                            payment_status = 'refunded',
                            updated_at = NOW()
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('subscription_updated', TRUE, 'new_status', 'cancelled');
                    ELSE
                        -- Outro status de pagamento, apenas registrar
                        result := result || jsonb_build_object(
                            'subscription_updated', FALSE,
                            'reason', 'Status de pagamento não tratado: ' || payment_status
                        );
                    END IF;
                ELSE
                    -- Nenhuma assinatura encontrada para este pagamento
                    result := result || jsonb_build_object(
                        'subscription_updated', FALSE,
                        'reason', 'Nenhuma assinatura encontrada para o ID de pagamento: ' || payment_id
                    );
                END IF;
            ELSE
                -- Nenhuma tabela de planos/assinaturas encontrada
                result := result || jsonb_build_object(
                    'warning', 'Nenhuma tabela de planos ou assinaturas encontrada no sistema'
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_message := 'Erro ao processar evento de pagamento: ' || SQLERRM;
            RAISE NOTICE '%', error_message;
            
            result := result || jsonb_build_object(
                'success', FALSE,
                'error', error_message
            );
        END;
    END IF;
    
    -- Processar eventos de assinatura
    IF event_type LIKE 'SUBSCRIPTION_%' AND subscription_data IS NOT NULL THEN
        subscription_id := subscription_data->>'id';
        subscription_status := subscription_data->>'status';
        
        -- Buscar o user_id e plan_id com base no subscription_id
        BEGIN
            -- Verificar se estamos usando benefit_plans
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') THEN
                SELECT bp.id, bp.user_id INTO plan_id, user_id
                FROM benefit_plans bp
                WHERE bp.subscription_id = subscription_id;
                
                IF plan_id IS NULL THEN
                    -- Tentar encontrar por external_reference
                    SELECT bp.id, bp.user_id INTO plan_id, user_id
                    FROM benefit_plans bp
                    WHERE bp.external_reference = subscription_data->>'externalReference';
                END IF;
                
                -- Atualizar o plano com base no status da assinatura
                IF plan_id IS NOT NULL THEN
                    IF subscription_status = 'ACTIVE' THEN
                        -- Assinatura ativa, garantir que o plano esteja ativo
                        UPDATE benefit_plans
                        SET status = 'active',
                            updated_at = NOW(),
                            subscription_status = subscription_status
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('plan_updated', TRUE, 'new_status', 'active');
                    ELSIF subscription_status = 'INACTIVE' THEN
                        -- Assinatura inativa, cancelar o plano
                        UPDATE benefit_plans
                        SET status = 'cancelled',
                            updated_at = NOW(),
                            subscription_status = subscription_status
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('plan_updated', TRUE, 'new_status', 'cancelled');
                    ELSE
                        -- Outro status de assinatura, apenas atualizar o subscription_status
                        UPDATE benefit_plans
                        SET updated_at = NOW(),
                            subscription_status = subscription_status
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('plan_updated', TRUE, 'subscription_status_updated', TRUE);
                    END IF;
                ELSE
                    -- Nenhum plano encontrado para esta assinatura
                    result := result || jsonb_build_object(
                        'plan_updated', FALSE,
                        'reason', 'Nenhum plano encontrado para o ID de assinatura: ' || subscription_id
                    );
                END IF;
            -- Verificar se estamos usando a tabela subscriptions
            ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
                -- Lógica para tabela subscriptions
                SELECT s.id, s.user_id INTO plan_id, user_id
                FROM subscriptions s
                WHERE s.asaas_subscription_id = subscription_id;
                
                IF plan_id IS NULL AND subscription_data->>'externalReference' IS NOT NULL THEN
                    -- Tentar encontrar por external_reference
                    BEGIN
                        SELECT s.id, s.user_id INTO plan_id, user_id
                        FROM subscriptions s
                        WHERE s.id = (subscription_data->>'externalReference')::UUID;
                    EXCEPTION WHEN OTHERS THEN
                        -- Erro ao converter external_reference para UUID
                        plan_id := NULL;
                        user_id := NULL;
                    END;
                END IF;
                
                IF plan_id IS NOT NULL THEN
                    -- Atualizar a assinatura com base no status
                    IF subscription_status = 'ACTIVE' THEN
                        UPDATE subscriptions
                        SET status = 'active',
                            asaas_subscription_id = subscription_id,
                            updated_at = NOW()
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('subscription_updated', TRUE, 'new_status', 'active');
                    ELSIF subscription_status = 'INACTIVE' THEN
                        UPDATE subscriptions
                        SET status = 'cancelled',
                            asaas_subscription_id = subscription_id,
                            updated_at = NOW()
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('subscription_updated', TRUE, 'new_status', 'cancelled');
                    ELSE
                        -- Apenas atualizar o ID da assinatura
                        UPDATE subscriptions
                        SET asaas_subscription_id = subscription_id,
                            updated_at = NOW()
                        WHERE id = plan_id;
                        
                        result := result || jsonb_build_object('subscription_updated', TRUE, 'asaas_subscription_id_updated', TRUE);
                    END IF;
                ELSE
                    -- Nenhuma assinatura encontrada
                    result := result || jsonb_build_object(
                        'subscription_updated', FALSE,
                        'reason', 'Nenhuma assinatura encontrada para o ID: ' || subscription_id
                    );
                END IF;
            ELSE
                -- Nenhuma tabela de planos/assinaturas encontrada
                result := result || jsonb_build_object(
                    'warning', 'Nenhuma tabela de planos ou assinaturas encontrada no sistema'
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_message := 'Erro ao processar evento de assinatura: ' || SQLERRM;
            RAISE NOTICE '%', error_message;
            
            result := result || jsonb_build_object(
                'success', FALSE,
                'error', error_message
            );
        END;
    END IF;
    
    -- Marcar evento como processado
    UPDATE public.asaas_webhook_events
    SET 
        processed = TRUE,
        processed_at = NOW()
    WHERE id = webhook_event_id;
    
    -- Retornar o resultado
    RETURN result || jsonb_build_object(
        'webhook_event_id', webhook_event_id
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Se houver erro, marcar evento como não processado
    IF webhook_event_id IS NOT NULL THEN
        UPDATE public.asaas_webhook_events
        SET 
            processed = FALSE,
            processed_at = NOW(),
            error_message = SQLERRM
        WHERE id = webhook_event_id;
    END IF;
    
    error_message := 'Erro inesperado ao processar webhook: ' || SQLERRM;
    RAISE NOTICE '%', error_message;
    
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', error_message,
        'webhook_event_id', webhook_event_id
    );
END;
$$;

-- 3. Atualizar a função reprocess_failed_webhook_event para usar o campo payload
DO $$
DECLARE
    func_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'reprocess_failed_webhook_event'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Atualizando função reprocess_failed_webhook_event...';
        
        -- Criar ou substituir a função
        EXECUTE $FUNC$
        CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(event_id UUID)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $BODY$
        DECLARE
            webhook_event RECORD;
            result JSONB;
        BEGIN
            -- Obter os dados do evento
            SELECT * INTO webhook_event
            FROM public.asaas_webhook_events
            WHERE id = event_id;
            
            IF webhook_event IS NULL THEN
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'message', 'Evento não encontrado'
                );
            END IF;
            
            -- Usar o campo payload se existir, caso contrário usar event_data
            IF webhook_event.payload IS NOT NULL THEN
                -- Reprocessar o evento
                result := public.process_asaas_webhook(webhook_event.payload);
            ELSIF webhook_event.event_data IS NOT NULL THEN
                -- Compatibilidade com versão anterior
                result := public.process_asaas_webhook(webhook_event.event_data);
            ELSE
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'message', 'Evento não contém dados para reprocessamento'
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
            WHERE id = event_id;
            
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
        $BODY$;
        $FUNC$;
        
        RAISE NOTICE 'Função reprocess_failed_webhook_event atualizada com sucesso.';
    ELSE
        RAISE NOTICE 'Função reprocess_failed_webhook_event não existe. Pulando atualização.';
    END IF;
END;
$$;

-- 4. Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE 'Script de correção do problema do event_id executado com sucesso!';
    RAISE NOTICE 'Agora a função process_asaas_webhook gera automaticamente um ID de evento quando não estiver presente no payload.';
END;
$$;
