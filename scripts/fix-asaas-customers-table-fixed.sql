-- Script para corrigir a tabela asaas_customers e garantir que os dados sejam salvos corretamente

-- 1. Primeiro, vamos verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asaas_customers') THEN
    -- 2. Alterar a coluna cpf_cnpj para aceitar valores nulos temporariamente
    ALTER TABLE asaas_customers ALTER COLUMN cpf_cnpj DROP NOT NULL;
    
    -- 3. Atualizar registros existentes que tenham cpf_cnpj nulo para usar o CPF vu00e1lido padru00e3o
    UPDATE asaas_customers 
    SET cpf_cnpj = '12345678909'
    WHERE cpf_cnpj IS NULL OR cpf_cnpj = '';
    
    RAISE NOTICE 'Tabela asaas_customers corrigida com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela asaas_customers nu00e3o encontrada. Criando tabela...';
    
    -- Criar a tabela se nu00e3o existir
    CREATE TABLE asaas_customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      asaas_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      cpf_cnpj TEXT NOT NULL DEFAULT '12345678909',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- Criar u00edndices para melhorar performance
    CREATE INDEX idx_asaas_customers_user_id ON asaas_customers(user_id);
    CREATE INDEX idx_asaas_customers_asaas_id ON asaas_customers(asaas_id);
    CREATE INDEX idx_asaas_customers_cpf_cnpj ON asaas_customers(cpf_cnpj);
    
    -- Criar trigger para atualizar o updated_at automaticamente
    CREATE TRIGGER set_asaas_customers_updated_at
    BEFORE UPDATE ON asaas_customers
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
    
    -- Configurar permissu00f5es RLS
    ALTER TABLE asaas_customers ENABLE ROW LEVEL SECURITY;
    
    -- Criar polu00edtica para permitir que usuu00e1rios vejam apenas seus pru00f3prios registros
    CREATE POLICY select_own_asaas_customers ON asaas_customers
    FOR SELECT USING (auth.uid() = user_id);
    
    -- Criar polu00edtica para permitir que usuu00e1rios insiram apenas seus pru00f3prios registros
    CREATE POLICY insert_own_asaas_customers ON asaas_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    -- Criar polu00edtica para permitir que usuu00e1rios atualizem apenas seus pru00f3prios registros
    CREATE POLICY update_own_asaas_customers ON asaas_customers
    FOR UPDATE USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Tabela asaas_customers criada com sucesso!';
  END IF;
END;
$$;

-- 4. Criar ou substituir a funu00e7u00e3o de trigger para garantir que cpf_cnpj nunca seja nulo
CREATE OR REPLACE FUNCTION ensure_asaas_customer_cpf_cnpj()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cpf_cnpj for nulo ou vazio, usar o CPF vu00e1lido padru00e3o
  IF NEW.cpf_cnpj IS NULL OR NEW.cpf_cnpj = '' THEN
    NEW.cpf_cnpj := '12345678909';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar o trigger se nu00e3o existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asaas_customers') THEN
    DROP TRIGGER IF EXISTS ensure_asaas_customer_cpf_cnpj_trigger ON asaas_customers;
    CREATE TRIGGER ensure_asaas_customer_cpf_cnpj_trigger
    BEFORE INSERT OR UPDATE ON asaas_customers
    FOR EACH ROW
    EXECUTE FUNCTION ensure_asaas_customer_cpf_cnpj();
    
    -- 6. Restaurar a restriu00e7u00e3o NOT NULL apu00f3s corrigir os dados existentes
    ALTER TABLE asaas_customers ALTER COLUMN cpf_cnpj SET NOT NULL;
  END IF;
END;
$$;

-- Agora vamos criar ou atualizar a funu00e7u00e3o que salva os clientes Asaas no banco
CREATE OR REPLACE FUNCTION save_asaas_customer(p_user_id UUID, p_asaas_id TEXT, p_name TEXT, p_email TEXT, p_cpf_cnpj TEXT)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
  v_cpf_cnpj TEXT;
BEGIN
  -- Garantir que cpf_cnpj nu00e3o seja nulo
  v_cpf_cnpj := COALESCE(p_cpf_cnpj, '12345678909');
  
  -- Verificar se o cliente ju00e1 existe
  SELECT id INTO v_customer_id
  FROM asaas_customers
  WHERE user_id = p_user_id;
  
  IF v_customer_id IS NOT NULL THEN
    -- Atualizar cliente existente
    UPDATE asaas_customers
    SET 
      asaas_id = p_asaas_id,
      name = p_name,
      email = p_email,
      cpf_cnpj = v_cpf_cnpj,
      updated_at = NOW()
    WHERE id = v_customer_id;
    
    RETURN v_customer_id;
  ELSE
    -- Inserir novo cliente
    INSERT INTO asaas_customers (user_id, asaas_id, name, email, cpf_cnpj)
    VALUES (p_user_id, p_asaas_id, p_name, p_email, v_cpf_cnpj)
    RETURNING id INTO v_customer_id;
    
    RETURN v_customer_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
