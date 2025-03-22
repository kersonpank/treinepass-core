-- Script para corrigir a referência à tabela de assinaturas na função process_asaas_webhook

-- 1. Verificar o nome correto da tabela de assinaturas
DO $$
DECLARE
    subscription_table TEXT;
BEGIN
    -- Verificar se existe alguma tabela com nome 'subscriptions'
    SELECT tablename INTO subscription_table
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'subscriptions';
    
    IF subscription_table IS NOT NULL THEN
        RAISE NOTICE 'Tabela subscriptions existe';
    ELSE
        -- Verificar se existe alguma tabela relacionada a assinaturas
        SELECT tablename INTO subscription_table
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE '%subscri%';
        
        IF subscription_table IS NOT NULL THEN
            RAISE NOTICE 'Tabela de assinaturas encontrada: %', subscription_table;
        ELSE
            -- Verificar se existe alguma tabela relacionada a inscrições
            SELECT tablename INTO subscription_table
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename LIKE '%inscri%';
            
            IF subscription_table IS NOT NULL THEN
                RAISE NOTICE 'Tabela de inscrições encontrada: %', subscription_table;
            ELSE
                RAISE NOTICE 'Nenhuma tabela de assinaturas ou inscrições encontrada';
            END IF;
        END IF;
    END IF;
END;
$$;

-- 2. Criar uma função para verificar a estrutura da tabela de assinaturas
CREATE OR REPLACE FUNCTION check_subscription_table() 
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    subscription_table TEXT;
    column_count INTEGER;
    result TEXT;
BEGIN
    -- Verificar se existe alguma tabela com nome 'subscriptions'
    SELECT tablename INTO subscription_table
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'subscriptions';
    
    IF subscription_table IS NOT NULL THEN
        -- Verificar se a tabela tem as colunas necessárias
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name IN ('id', 'status', 'payment_status', 'asaas_subscription_id', 'updated_at');
        
        IF column_count = 5 THEN
            result := 'subscriptions';
        ELSE
            result := 'subscriptions_missing_columns';
        END IF;
    ELSE
        -- Verificar se existe alguma tabela relacionada a assinaturas
        SELECT tablename INTO subscription_table
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE '%subscri%';
        
        IF subscription_table IS NOT NULL THEN
            -- Verificar se a tabela tem as colunas necessárias
            SELECT COUNT(*) INTO column_count
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = subscription_table
            AND column_name IN ('id', 'status', 'payment_status', 'asaas_subscription_id', 'updated_at');
            
            IF column_count = 5 THEN
                result := subscription_table;
            ELSE
                result := subscription_table || '_missing_columns';
            END IF;
        ELSE
            -- Verificar se existe alguma tabela relacionada a inscrições
            SELECT tablename INTO subscription_table
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename LIKE '%inscri%';
            
            IF subscription_table IS NOT NULL THEN
                -- Verificar se a tabela tem as colunas necessárias
                SELECT COUNT(*) INTO column_count
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = subscription_table
                AND column_name IN ('id', 'status', 'payment_status', 'asaas_subscription_id', 'updated_at');
                
                IF column_count = 5 THEN
                    result := subscription_table;
                ELSE
                    result := subscription_table || '_missing_columns';
                END IF;
            ELSE
                result := 'not_found';
            END IF;
        END IF;
    END IF;
    
    RETURN result;
END;
$$;

-- 3. Executar a função para verificar a tabela
SELECT check_subscription_table();
