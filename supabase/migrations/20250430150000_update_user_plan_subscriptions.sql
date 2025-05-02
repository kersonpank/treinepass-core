-- Adiciona o valor 'mercadopago' como opção válida para o campo payment_method na tabela user_plan_subscriptions

-- Primeiro, vamos verificar se a restrição existe e qual é o seu nome
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'user_plan_subscriptions'::regclass
  AND conname LIKE '%payment_method%';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE user_plan_subscriptions DROP CONSTRAINT ' || constraint_name;
  END IF;
END
$$;

-- Agora adicionamos a nova restrição incluindo 'mercadopago'
ALTER TABLE user_plan_subscriptions
ADD CONSTRAINT check_payment_method
CHECK (payment_method IN ('transfer', 'credit_card', 'debit_card', 'pix', 'boleto', 'mercadopago'));

-- Adicionar índice para melhorar a performance de consultas por payment_method
CREATE INDEX IF NOT EXISTS idx_user_plan_subscriptions_payment_method
ON user_plan_subscriptions(payment_method);
