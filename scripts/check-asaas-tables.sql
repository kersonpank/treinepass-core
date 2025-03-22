-- Script para verificar a estrutura das tabelas relacionadas ao Asaas

-- 1. Verificar a estrutura da tabela asaas_customers
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND 
  table_name = 'asaas_customers'
ORDER BY 
  ordinal_position;

-- 2. Verificar as polu00edticas RLS da tabela asaas_customers
SELECT 
  polname AS policy_name,
  polpermissive AS is_permissive,
  polcmd AS command,
  polqual::text AS using_expression,
  polwithcheck::text AS with_check_expression
FROM 
  pg_policy
WHERE 
  polrelid = 'public.asaas_customers'::regclass;

-- 3. Verificar se RLS estu00e1 habilitado
SELECT
  relname AS table_name,
  relrowsecurity AS row_level_security_enabled
FROM
  pg_class
WHERE
  relname = 'asaas_customers' AND
  relnamespace = 'public'::regnamespace;

-- 4. Verificar as permissu00f5es da tabela
SELECT
  grantee,
  privilege_type
FROM
  information_schema.role_table_grants
WHERE
  table_schema = 'public' AND
  table_name = 'asaas_customers';

-- 5. Verificar se a funu00e7u00e3o http_post existe
SELECT
  proname AS function_name,
  pronamespace::regnamespace AS schema_name,
  pronargs AS num_arguments
FROM
  pg_proc
WHERE
  proname = 'http_post' AND
  pronamespace = 'extensions'::regnamespace;
