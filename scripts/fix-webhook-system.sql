-- Script para corrigir o sistema de webhooks do Asaas
-- Este script verifica e corrige permissões, estrutura da tabela e funções necessárias

-- 1. Verificar tabelas existentes
DO $$
DECLARE
    webhook_table_exists BOOLEAN;
    plans_table_exists BOOLEAN;
    subscriptions_table_exists BOOLEAN;
    benefit_plans_table_exists BOOLEAN;
    missing_tables TEXT := '';
BEGIN
    -- Verificar tabela de eventos de webhook
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_webhook_events') INTO webhook_table_exists;
    
    -- Verificar tabela de planos
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plans') INTO plans_table_exists;
    
    -- Verificar tabela de assinaturas
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') INTO subscriptions_table_exists;
    
    -- Verificar tabela de planos de benefícios
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') INTO benefit_plans_table_exists;
    
    -- Construir mensagem de tabelas faltantes
    IF NOT webhook_table_exists THEN
        missing_tables := missing_tables || 'asaas_webhook_events, ';
    END IF;
    
    IF NOT plans_table_exists AND NOT benefit_plans_table_exists THEN
        missing_tables := missing_tables || 'plans ou benefit_plans, ';
    END IF;
    
    IF NOT subscriptions_table_exists AND NOT benefit_plans_table_exists THEN
        missing_tables := missing_tables || 'subscriptions ou benefit_plans, ';
    END IF;
    
    -- Mostrar mensagem com tabelas faltantes
    IF LENGTH(missing_tables) > 0 THEN
        missing_tables := SUBSTRING(missing_tables, 1, LENGTH(missing_tables) - 2);
        RAISE NOTICE 'As seguintes tabelas estão faltando: %', missing_tables;
    ELSE
        RAISE NOTICE 'Todas as tabelas necessárias existem.';
    END IF;
    
    -- Criar tabela de eventos de webhook se não existir
    IF NOT webhook_table_exists THEN
        CREATE TABLE public.asaas_webhook_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id TEXT,
            event_type TEXT NOT NULL,
            payment_id TEXT,
            subscription_id TEXT,
            customer_id TEXT,
            payload JSONB NOT NULL,
            processed BOOLEAN DEFAULT FALSE,
            processed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            error_message TEXT,
            retry_count INTEGER DEFAULT 0
        );
        
        -- Criar índices para melhorar a performance
        CREATE INDEX idx_asaas_webhook_events_event_type ON public.asaas_webhook_events(event_type);
        CREATE INDEX idx_asaas_webhook_events_processed ON public.asaas_webhook_events(processed);
        CREATE INDEX idx_asaas_webhook_events_payment_id ON public.asaas_webhook_events(payment_id) WHERE payment_id IS NOT NULL;
        CREATE INDEX idx_asaas_webhook_events_subscription_id ON public.asaas_webhook_events(subscription_id) WHERE subscription_id IS NOT NULL;
        
        RAISE NOTICE 'Tabela asaas_webhook_events criada com sucesso.';
    ELSE
        -- Verificar se a coluna event_id existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'event_id') THEN
            ALTER TABLE public.asaas_webhook_events ADD COLUMN event_id TEXT;
            RAISE NOTICE 'Coluna event_id adicionada à tabela asaas_webhook_events.';
        END IF;
        
        -- Verificar se a coluna payment_id existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'payment_id') THEN
            ALTER TABLE public.asaas_webhook_events ADD COLUMN payment_id TEXT;
            RAISE NOTICE 'Coluna payment_id adicionada à tabela asaas_webhook_events.';
        END IF;
        
        -- Verificar se a coluna subscription_id existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'subscription_id') THEN
            ALTER TABLE public.asaas_webhook_events ADD COLUMN subscription_id TEXT;
            RAISE NOTICE 'Coluna subscription_id adicionada à tabela asaas_webhook_events.';
        END IF;
        
        -- Verificar se a coluna customer_id existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'customer_id') THEN
            ALTER TABLE public.asaas_webhook_events ADD COLUMN customer_id TEXT;
            RAISE NOTICE 'Coluna customer_id adicionada à tabela asaas_webhook_events.';
        END IF;
        
        -- Verificar se a coluna payload existe
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'event_data') AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'payload') THEN
            ALTER TABLE public.asaas_webhook_events ADD COLUMN payload JSONB;
            UPDATE public.asaas_webhook_events SET payload = event_data;
            RAISE NOTICE 'Coluna payload adicionada à tabela asaas_webhook_events e dados migrados de event_data.';
        END IF;
        
        -- Verificar se a coluna retry_count existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'retry_count') THEN
            ALTER TABLE public.asaas_webhook_events ADD COLUMN retry_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Coluna retry_count adicionada à tabela asaas_webhook_events.';
        END IF;
        
        -- Verificar se a coluna error_message existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'error_message') THEN
            ALTER TABLE public.asaas_webhook_events ADD COLUMN error_message TEXT;
            RAISE NOTICE 'Coluna error_message adicionada à tabela asaas_webhook_events.';
        END IF;
    END IF;
END;
$$;

-- 2. Corrigir função process_asaas_webhook para compatibilidade com o sistema existente
CREATE OR REPLACE FUNCTION public.process_asaas_webhook(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_data JSONB;
    subscription_data JSONB;
    payment_status TEXT;
    payment_record RECORD;
    subscription_record RECORD;
    webhook_event_id UUID;
    checkout_session RECORD;
    event_type TEXT;
    event_id TEXT;
    benefit_plan_record RECORD;
    result JSONB;
    log_message TEXT;
    error_message TEXT;
BEGIN
    -- Log inicial
    RAISE NOTICE 'Processando webhook do Asaas: %', payload;

    -- Extrair tipo de evento
    event_type := payload->>'event';
    
    -- Gerar um ID de evento se não estiver presente
    event_id := payload->>'id';
    IF event_id IS NULL THEN
        event_id := 'evt_' || md5(payload::TEXT) || '_' || floor(random() * 10000000);
    END IF;
    
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
        CASE WHEN event_type LIKE 'PAYMENT%' THEN (payload->'payment'->>'id')::TEXT ELSE NULL END,
        CASE WHEN event_type LIKE 'SUBSCRIPTION%' THEN (payload->'subscription'->>'id')::TEXT ELSE NULL END,
        CASE 
            WHEN event_type LIKE 'PAYMENT%' THEN (payload->'payment'->>'customer')::TEXT
            WHEN event_type LIKE 'SUBSCRIPTION%' THEN (payload->'subscription'->>'customer')::TEXT
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
        'message', 'Evento processado com sucesso'
    );

    -- Processar diferentes tipos de eventos
    CASE event_type
        WHEN 'SUBSCRIPTION_CREATED' THEN
            subscription_data := payload->'subscription';
            
            -- Verificar se estamos usando a tabela subscriptions ou benefit_plans
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
                -- Verificar se a assinatura já existe
                SELECT * INTO subscription_record
                FROM subscriptions
                WHERE asaas_subscription_id = subscription_data->>'id';
                
                IF NOT FOUND THEN
                    -- Tentar encontrar por external_reference
                    BEGIN
                        SELECT * INTO subscription_record
                        FROM subscriptions
                        WHERE id = (subscription_data->>'externalReference')::UUID;
                    EXCEPTION WHEN OTHERS THEN
                        subscription_record := NULL;
                    END;
                END IF;
                
                IF subscription_record IS NULL THEN
                    -- Registrar histórico inicial se a função existir
                    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'record_subscription_history') THEN
                        BEGIN
                            PERFORM record_subscription_history(
                                (subscription_data->>'externalReference')::UUID,
                                (SELECT user_id FROM asaas_customers WHERE asaas_id = subscription_data->>'customer'),
                                (SELECT plan_id FROM subscriptions WHERE id = (subscription_data->>'externalReference')::UUID),
                                'pending',
                                'pending',
                                NOW(),
                                (subscription_data->>'nextDueDate')::TIMESTAMP WITH TIME ZONE
                            );
                        EXCEPTION WHEN OTHERS THEN
                            RAISE NOTICE 'Erro ao registrar histórico: %', SQLERRM;
                        END;
                    END IF;
                END IF;
            ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') THEN
                -- Verificar se o plano de benefício já existe
                SELECT * INTO benefit_plan_record
                FROM benefit_plans
                WHERE subscription_id = subscription_data->>'id';
                
                IF NOT FOUND THEN
                    -- Tentar encontrar por external_reference
                    BEGIN
                        SELECT * INTO benefit_plan_record
                        FROM benefit_plans
                        WHERE external_reference = subscription_data->>'externalReference';
                    EXCEPTION WHEN OTHERS THEN
                        benefit_plan_record := NULL;
                    END;
                END IF;
                
                IF benefit_plan_record IS NOT NULL THEN
                    -- Atualizar o plano de benefício
                    UPDATE benefit_plans
                    SET subscription_id = subscription_data->>'id',
                        updated_at = NOW(),
                        subscription_status = 'ACTIVE'
                    WHERE id = benefit_plan_record.id;
                    
                    result := result || jsonb_build_object('benefit_plan_updated', TRUE);
                ELSE
                    -- Não encontrou o plano, apenas registrar o evento
                    result := result || jsonb_build_object(
                        'message', 'Assinatura criada, mas plano não encontrado',
                        'external_reference', subscription_data->>'externalReference'
                    );
                END IF;
            END IF;

        WHEN 'PAYMENT_CREATED' THEN
            payment_data := payload->'payment';
            
            -- Verificar se estamos usando a tabela asaas_payments
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_payments') THEN
                -- Buscar pagamento no nosso sistema
                SELECT * INTO payment_record
                FROM asaas_payments
                WHERE asaas_id = (payment_data->>'id');

                IF FOUND THEN
                    -- Atualizar status do pagamento
                    UPDATE asaas_payments
                    SET 
                        status = 'PENDING',
                        billing_type = payment_data->>'billingType',
                        updated_at = NOW()
                    WHERE id = payment_record.id;

                    -- Atualizar histórico se a tabela subscription_history existir
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_history') THEN
                        UPDATE subscription_history
                        SET 
                            payment_status = 'pending',
                            updated_at = NOW()
                        WHERE subscription_id = payment_record.subscription_id
                        AND end_date IS NULL;
                    END IF;
                END IF;
            ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') THEN
                -- Buscar plano de benefício associado ao pagamento
                SELECT * INTO benefit_plan_record
                FROM benefit_plans
                WHERE payment_id = payment_data->>'id';
                
                IF NOT FOUND THEN
                    -- Tentar encontrar por external_reference
                    BEGIN
                        SELECT * INTO benefit_plan_record
                        FROM benefit_plans
                        WHERE external_reference = payment_data->>'externalReference';
                    EXCEPTION WHEN OTHERS THEN
                        benefit_plan_record := NULL;
                    END;
                END IF;
                
                IF benefit_plan_record IS NOT NULL THEN
                    -- Atualizar o plano de benefício
                    UPDATE benefit_plans
                    SET payment_id = payment_data->>'id',
                        payment_status = 'PENDING',
                        updated_at = NOW()
                    WHERE id = benefit_plan_record.id;
                    
                    result := result || jsonb_build_object('benefit_plan_updated', TRUE);
                END IF;
            END IF;

        WHEN 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED' THEN
            payment_data := payload->'payment';
            
            -- Verificar se estamos usando a tabela asaas_payments
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_payments') THEN
                -- Buscar pagamento no nosso sistema
                SELECT * INTO payment_record
                FROM asaas_payments
                WHERE asaas_id = (payment_data->>'id');

                IF FOUND THEN
                    -- Atualizar status do pagamento
                    UPDATE asaas_payments
                    SET 
                        status = CASE WHEN event_type = 'PAYMENT_RECEIVED' THEN 'RECEIVED' ELSE 'CONFIRMED' END,
                        billing_type = payment_data->>'billingType',
                        updated_at = NOW()
                    WHERE id = payment_record.id;

                    -- Buscar assinatura
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
                        SELECT * INTO subscription_record
                        FROM subscriptions
                        WHERE id = payment_record.subscription_id;

                        IF FOUND THEN
                            -- Atualizar status da assinatura
                            UPDATE subscriptions
                            SET 
                                status = 'active',
                                payment_status = 'paid',
                                updated_at = NOW()
                            WHERE id = subscription_record.id;

                            -- Atualizar histórico
                            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_history') THEN
                                UPDATE subscription_history
                                SET 
                                    status = 'active',
                                    payment_status = 'paid',
                                    updated_at = NOW()
                                WHERE subscription_id = subscription_record.id
                                AND end_date IS NULL;
                            END IF;

                            -- Atualizar status da sessão de checkout
                            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkout_sessions') THEN
                                UPDATE checkout_sessions
                                SET 
                                    status = 'completed',
                                    updated_at = NOW()
                                WHERE payment_id = payment_record.id;
                            END IF;
                        END IF;
                    END IF;
                END IF;
            ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') THEN
                -- Buscar plano de benefício associado ao pagamento
                SELECT * INTO benefit_plan_record
                FROM benefit_plans
                WHERE payment_id = payment_data->>'id';
                
                IF NOT FOUND THEN
                    -- Tentar encontrar por external_reference
                    BEGIN
                        SELECT * INTO benefit_plan_record
                        FROM benefit_plans
                        WHERE external_reference = payment_data->>'externalReference';
                    EXCEPTION WHEN OTHERS THEN
                        benefit_plan_record := NULL;
                    END;
                END IF;
                
                IF benefit_plan_record IS NOT NULL THEN
                    -- Atualizar o plano de benefício
                    UPDATE benefit_plans
                    SET payment_status = 'CONFIRMED',
                        status = 'active',
                        updated_at = NOW()
                    WHERE id = benefit_plan_record.id;
                    
                    result := result || jsonb_build_object('benefit_plan_updated', TRUE, 'new_status', 'active');
                END IF;
            END IF;
            
        ELSE
            -- Caso para eventos desconhecidos ou não tratados
            RAISE NOTICE 'Evento não tratado: %', event_type;
    END CASE;

    -- Marcar evento como processado
    UPDATE public.asaas_webhook_events
    SET 
        processed = TRUE,
        processed_at = NOW()
    WHERE id = webhook_event_id;

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

    RAISE NOTICE 'Erro ao processar webhook: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'webhook_event_id', webhook_event_id
    );
END;
$$;

-- 3. Criar função para reprocessar eventos com erro (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'reprocess_failed_webhook_event') THEN
        CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(event_id UUID)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
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
            
            -- Reprocessar o evento
            result := public.process_asaas_webhook(webhook_event.payload);
            
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
        $$;
        
        RAISE NOTICE 'Função reprocess_failed_webhook_event criada com sucesso.';
    ELSE
        RAISE NOTICE 'Função reprocess_failed_webhook_event já existe.';
    END IF;
END;
$$;

-- 4. Configurar permissões da tabela e funções
DO $$
BEGIN
    -- Habilitar RLS na tabela de eventos
    ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes para evitar conflitos
    DROP POLICY IF EXISTS admin_policy ON public.asaas_webhook_events;
    DROP POLICY IF EXISTS service_role_policy ON public.asaas_webhook_events;
    DROP POLICY IF EXISTS authenticated_policy ON public.asaas_webhook_events;
    
    -- Criar política para usuários administradores
    CREATE POLICY admin_policy ON public.asaas_webhook_events
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE auth.uid() = id
                AND raw_user_meta_data->>'role' = 'admin'
            )
        );
    
    -- Política para o service_role (usado pela API e funções)
    CREATE POLICY service_role_policy ON public.asaas_webhook_events
        FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role');
    
    -- Garantir permissões corretas
    GRANT ALL ON TABLE public.asaas_webhook_events TO postgres, service_role;
    GRANT ALL ON FUNCTION public.process_asaas_webhook(JSONB) TO postgres, service_role;
    GRANT ALL ON FUNCTION public.reprocess_failed_webhook_event(UUID) TO postgres, service_role;
    
    RAISE NOTICE 'Permissões configuradas com sucesso.';
END;
$$;

-- 5. Criar função de teste para verificar permissões
CREATE OR REPLACE FUNCTION public.test_webhook_events_access()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO event_count FROM public.asaas_webhook_events;
    RETURN 'Acesso bem-sucedido. Total de eventos: ' || event_count;
EXCEPTION WHEN OTHERS THEN
    RETURN 'Erro ao acessar a tabela: ' || SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_webhook_events_access() TO authenticated, service_role;

-- 6. Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE 'Script de correção do sistema de webhooks executado com sucesso!';
    RAISE NOTICE 'Para testar o acesso à tabela, execute: SELECT test_webhook_events_access();';
END;
$$;
