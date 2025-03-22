-- Script para verificar as tabelas existentes no banco de dados

-- 1. Listar todas as tabelas no esquema public
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Verificar se existe alguma tabela relacionada a assinaturas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%subscri%';

-- 3. Verificar se existe alguma tabela relacionada a inscrições
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%inscri%';

-- 4. Verificar se existe alguma tabela relacionada a pagamentos
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%pay%';

-- 5. Verificar se existe alguma tabela relacionada a asaas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%asaas%';
