-- Script para verificar e corrigir a funu00e7u00e3o validate_check_in_rules

-- Verificar a estrutura atual da funu00e7u00e3o
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_check_in_rules';

-- Verificar os campos retornados pela funu00e7u00e3o
SELECT * 
FROM information_schema.routines
WHERE routine_name = 'validate_check_in_rules';

-- Verificar as colunas da tabela de retorno
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'validate_check_in_rules';

-- Verificar se a funu00e7u00e3o existe e seu tipo de retorno
SELECT 
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS result_type,
    pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'validate_check_in_rules';

-- Testar a funu00e7u00e3o com um ID de usuu00e1rio e academia vazio
SELECT * FROM validate_check_in_rules('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');
