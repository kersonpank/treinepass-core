-- Criar função para inserir academia com validação de transação
CREATE OR REPLACE FUNCTION create_academia(
  user_id UUID,
  nome TEXT,
  cnpj_input TEXT,
  telefone TEXT,
  email_input TEXT,
  endereco TEXT,
  horario_funcionamento JSONB,
  modalidades TEXT[],
  status TEXT
) RETURNS TABLE (
  id UUID,
  nome TEXT,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  horario_funcionamento JSONB,
  modalidades TEXT[],
  status TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID
) LANGUAGE plpgsql
AS $$
BEGIN
  -- Iniciar transação explícita
  BEGIN
    -- Verificar duplicatas novamente (dupla verificação por segurança)
    IF EXISTS (SELECT 1 FROM academias WHERE email = email_input) THEN
      RAISE EXCEPTION 'Email já cadastrado' USING ERRCODE = 'P0001';
    END IF;

    IF EXISTS (SELECT 1 FROM academias WHERE cnpj = cnpj_input) THEN
      RAISE EXCEPTION 'CNPJ já cadastrado' USING ERRCODE = 'P0001';
    END IF;

    -- Inserir academia
    RETURN QUERY
    INSERT INTO academias (
      user_id,
      nome,
      cnpj,
      telefone,
      email,
      endereco,
      horario_funcionamento,
      modalidades,
      status
    )
    VALUES (
      user_id,
      nome,
      cnpj_input,
      telefone,
      email_input,
      endereco,
      horario_funcionamento,
      modalidades,
      status
    )
    RETURNING *;

    -- Se chegou até aqui, commit implícito
  EXCEPTION
    WHEN OTHERS THEN
      -- Em caso de erro, rollback implícito
      RAISE;
  END;
END;
$$;
