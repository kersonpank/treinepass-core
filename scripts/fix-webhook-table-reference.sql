-- Script para corrigir a referência à tabela na função process_asaas_webhook

-- 1. Criar uma função para atualizar a função process_asaas_webhook com o nome correto da tabela
CREATE OR REPLACE FUNCTION update_webhook_function(table_name TEXT) 
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    func_definition TEXT;
    updated_definition TEXT;
BEGIN
    -- Obter a definição atual da função
    SELECT pg_get_functiondef(p.oid)
    INTO func_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'process_asaas_webhook';
    
    IF func_definition IS NULL THEN
        RAISE EXCEPTION 'Função process_asaas_webhook não encontrada';
    END IF;
    
    -- Substituir todas as ocorrências de 'subscriptions' pelo nome correto da tabela
    updated_definition := REPLACE(func_definition, 'subscriptions', table_name);
    
    -- Executar a definição atualizada
    EXECUTE updated_definition;
    
    RAISE NOTICE 'Função process_asaas_webhook atualizada para usar a tabela %', table_name;
END;
$$;

-- 2. Executar a função para atualizar a função process_asaas_webhook
-- Substitua 'inscricoes' pelo nome correto da tabela
SELECT update_webhook_function('inscricoes');

-- 3. Verificar se a função foi atualizada corretamente
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
    
    IF func_definition LIKE '%inscricoes%' THEN
        RAISE NOTICE 'A função process_asaas_webhook foi atualizada para usar a tabela inscricoes';
    ELSE
        RAISE NOTICE 'A função process_asaas_webhook não foi atualizada corretamente';
    END IF;
END;
$$;
