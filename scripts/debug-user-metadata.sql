-- Script para depurar os metadados do usuu00e1rio

-- Verificar a estrutura dos metadados do usuu00e1rio
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'cpf' as cpf
FROM auth.users
LIMIT 5;
