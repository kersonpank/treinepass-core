-- Script para encontrar a tabela de inscriu00e7u00f5es/assinaturas e atualizar a funu00e7u00e3o process_asaas_webhook

-- 1. Listar todas as tabelas no esquema public
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Verificar se existe alguma tabela relacionada a inscriu00e7u00f5es
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%inscri%';

-- 3. Verificar se existe alguma tabela relacionada a planos
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%plan%';

-- 4. Verificar se existe alguma tabela relacionada a assinaturas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%assinat%';

-- 5. Verificar se existe alguma tabela relacionada a pagamentos
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%pagament%';

-- 6. Verificar a estrutura da tabela inscricoes (se existir)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'inscricoes';

-- 7. Verificar a estrutura da tabela assinaturas (se existir)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'assinaturas';

-- 8. Verificar a estrutura da tabela planos (se existir)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'planos';
