-- Script para verificar o status atual do sistema de webhooks

-- 1. Verificar tabelas existentes
DO $$
DECLARE
    webhook_table_exists BOOLEAN;
    plans_table_exists BOOLEAN;
    subscriptions_table_exists BOOLEAN;
    benefit_plans_table_exists BOOLEAN;
    missing_tables TEXT := '';
    col RECORD;
BEGIN
    -- Verificar tabela de eventos de webhook
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_webhook_events') INTO webhook_table_exists;
    
    -- Verificar tabela de planos
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plans') INTO plans_table_exists;
    
    -- Verificar tabela de assinaturas
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') INTO subscriptions_table_exists;
    
    -- Verificar tabela de planos de benefícios
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') INTO benefit_plans_table_exists;
    
    -- Mostrar tabelas existentes
    RAISE NOTICE 'Tabelas existentes:';
    RAISE NOTICE 'asaas_webhook_events: %', webhook_table_exists;
    RAISE NOTICE 'plans: %', plans_table_exists;
    RAISE NOTICE 'subscriptions: %', subscriptions_table_exists;
    RAISE NOTICE 'benefit_plans: %', benefit_plans_table_exists;
    
    -- Verificar estrutura da tabela de eventos de webhook
    IF webhook_table_exists THEN
        RAISE NOTICE '\nEstrutura da tabela asaas_webhook_events:';
        FOR col IN (
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events'
            ORDER BY ordinal_position
        ) LOOP
            RAISE NOTICE '%: % (nullable: %)', col.column_name, col.data_type, col.is_nullable;
        END LOOP;
    END IF;
END;
$$;

-- 2. Verificar eventos de webhook recebidos
DO $$
DECLARE
    event_count INTEGER;
    error_count INTEGER;
    success_count INTEGER;
    recent_events RECORD;
    webhook_table_exists BOOLEAN;
BEGIN
    -- Verificar se a tabela existe
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_webhook_events') INTO webhook_table_exists;
    
    IF NOT webhook_table_exists THEN
        RAISE NOTICE 'A tabela asaas_webhook_events não existe.';
        RETURN;
    END IF;
    
    -- Contar eventos
    SELECT COUNT(*) INTO event_count FROM public.asaas_webhook_events;
    SELECT COUNT(*) INTO error_count FROM public.asaas_webhook_events WHERE processed = false OR error_message IS NOT NULL;
    SELECT COUNT(*) INTO success_count FROM public.asaas_webhook_events WHERE processed = true AND error_message IS NULL;
    
    RAISE NOTICE '\nEstatísticas de eventos de webhook:';
    RAISE NOTICE 'Total de eventos: %', event_count;
    RAISE NOTICE 'Eventos com sucesso: %', success_count;
    RAISE NOTICE 'Eventos com erro: %', error_count;
    
    -- Mostrar eventos recentes
    RAISE NOTICE '\nEventos recentes:';
    FOR recent_events IN (
        SELECT id, event_type, processed, error_message, created_at
        FROM public.asaas_webhook_events
        ORDER BY created_at DESC
        LIMIT 5
    ) LOOP
        RAISE NOTICE 'ID: %, Tipo: %, Processado: %, Data: %, Erro: %', 
            recent_events.id, 
            recent_events.event_type, 
            recent_events.processed, 
            recent_events.created_at, 
            COALESCE(recent_events.error_message, 'N/A');
    END LOOP;
    
    -- Mostrar eventos com erro
    IF error_count > 0 THEN
        RAISE NOTICE '\nEventos com erro:';
        FOR recent_events IN (
            SELECT id, event_type, retry_count, error_message, created_at
            FROM public.asaas_webhook_events
            WHERE processed = false OR error_message IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 5
        ) LOOP
            RAISE NOTICE 'ID: %, Tipo: %, Tentativas: %, Data: %, Erro: %', 
                recent_events.id, 
                recent_events.event_type, 
                COALESCE(recent_events.retry_count, 0), 
                recent_events.created_at, 
                COALESCE(recent_events.error_message, 'N/A');
        END LOOP;
    END IF;
END;
$$;

-- 3. Verificar funções existentes
DO $$
DECLARE
    process_webhook_exists BOOLEAN;
    reprocess_webhook_exists BOOLEAN;
    perm RECORD;
BEGIN
    -- Verificar funções
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'process_asaas_webhook'
    ) INTO process_webhook_exists;
    
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'reprocess_failed_webhook_event'
    ) INTO reprocess_webhook_exists;
    
    RAISE NOTICE '\nFunções de webhook:';
    RAISE NOTICE 'process_asaas_webhook: %', process_webhook_exists;
    RAISE NOTICE 'reprocess_failed_webhook_event: %', reprocess_webhook_exists;
    
    -- Verificar permissões
    RAISE NOTICE '\nPermissões:';
    FOR perm IN (
        SELECT grantee, privilege_type
        FROM information_schema.role_table_grants
        WHERE table_name = 'asaas_webhook_events' AND table_schema = 'public'
        ORDER BY grantee, privilege_type
    ) LOOP
        RAISE NOTICE 'asaas_webhook_events: % tem permissão %', perm.grantee, perm.privilege_type;
    END LOOP;
END;
$$;

-- 4. Verificar políticas RLS
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_record RECORD;
BEGIN
    -- Verificar se RLS está habilitado
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'asaas_webhook_events' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE '\nRow Level Security (RLS):';
    RAISE NOTICE 'RLS habilitado para asaas_webhook_events: %', COALESCE(rls_enabled, false);
    
    -- Listar políticas
    RAISE NOTICE '\nPolíticas RLS existentes:';
    FOR policy_record IN (
        SELECT polname, polcmd, polpermissive
        FROM pg_policy
        WHERE polrelid = 'public.asaas_webhook_events'::regclass
    ) LOOP
        RAISE NOTICE 'Política: %, Comando: %, Permissiva: %', 
            policy_record.polname, 
            CASE policy_record.polcmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'a' THEN 'INSERT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'd' THEN 'DELETE'
                WHEN '*' THEN 'ALL'
                ELSE policy_record.polcmd::text
            END,
            policy_record.polpermissive;
    END LOOP;
END;
$$;

-- 5. Verificar status das assinaturas/planos
DO $$
DECLARE
    subscriptions_table_exists BOOLEAN;
    benefit_plans_table_exists BOOLEAN;
    subscription_count INTEGER;
    benefit_plan_count INTEGER;
    subscription_record RECORD;
    benefit_plan_record RECORD;
BEGIN
    -- Verificar tabelas
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') INTO subscriptions_table_exists;
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefit_plans') INTO benefit_plans_table_exists;
    
    RAISE NOTICE '\nStatus das assinaturas/planos:';
    
    -- Verificar assinaturas
    IF subscriptions_table_exists THEN
        SELECT COUNT(*) INTO subscription_count FROM public.subscriptions;
        RAISE NOTICE 'Total de assinaturas: %', subscription_count;
        
        RAISE NOTICE '\nAssinaturas recentes:';
        FOR subscription_record IN (
            SELECT id, user_id, status, payment_status, created_at, updated_at
            FROM public.subscriptions
            ORDER BY created_at DESC
            LIMIT 5
        ) LOOP
            RAISE NOTICE 'ID: %, Usuário: %, Status: %, Status Pagamento: %, Criado: %, Atualizado: %', 
                subscription_record.id, 
                subscription_record.user_id, 
                subscription_record.status, 
                subscription_record.payment_status, 
                subscription_record.created_at, 
                subscription_record.updated_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'Tabela subscriptions não existe.';
    END IF;
    
    -- Verificar planos de benefício
    IF benefit_plans_table_exists THEN
        SELECT COUNT(*) INTO benefit_plan_count FROM public.benefit_plans;
        RAISE NOTICE '\nTotal de planos de benefício: %', benefit_plan_count;
        
        RAISE NOTICE '\nPlanos de benefício recentes:';
        FOR benefit_plan_record IN (
            SELECT id, user_id, status, payment_id, subscription_id, created_at, updated_at
            FROM public.benefit_plans
            ORDER BY created_at DESC
            LIMIT 5
        ) LOOP
            RAISE NOTICE 'ID: %, Usuário: %, Status: %, ID Pagamento: %, ID Assinatura: %, Criado: %, Atualizado: %', 
                benefit_plan_record.id, 
                benefit_plan_record.user_id, 
                benefit_plan_record.status, 
                COALESCE(benefit_plan_record.payment_id, 'N/A'), 
                COALESCE(benefit_plan_record.subscription_id, 'N/A'), 
                benefit_plan_record.created_at, 
                benefit_plan_record.updated_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'Tabela benefit_plans não existe.';
    END IF;
END;
$$;
