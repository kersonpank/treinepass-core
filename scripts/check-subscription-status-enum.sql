-- Verificar os valores permitidos para o enum plan_subscription_status
SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM
  pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
WHERE
  t.typname = 'plan_subscription_status'
ORDER BY
  e.enumsortorder;

-- Verificar a estrutura da tabela user_plan_subscriptions
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM 
  information_schema.columns
WHERE 
  table_name = 'user_plan_subscriptions';

-- Verificar valores distintos atualmente usados na coluna status
SELECT DISTINCT status FROM user_plan_subscriptions;
