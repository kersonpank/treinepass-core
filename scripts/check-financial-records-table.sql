-- Verificar se a tabela gym_check_in_financial_records existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'gym_check_in_financial_records'
);

-- Verificar todas as tabelas relacionadas a check-in
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%check%';

-- Verificar todas as tabelas relacionadas a financeiro
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%financ%';
