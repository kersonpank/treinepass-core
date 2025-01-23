CREATE OR REPLACE FUNCTION public.create_academia_v2(
  p_user_id uuid,
  p_nome text,
  p_cnpj text,
  p_telefone text,
  p_email text,
  p_endereco text,
  p_horario_funcionamento jsonb,
  p_modalidades text[],
  p_status text DEFAULT 'pendente'::text
)
RETURNS TABLE(academia_id uuid, user_type text, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_academia_id UUID;
  v_existing_gym_id UUID;
BEGIN
  -- Check for existing CNPJ
  SELECT id INTO v_existing_gym_id
  FROM academias
  WHERE cnpj = p_cnpj;
  
  IF v_existing_gym_id IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_existing_gym_id,
      NULL::TEXT,
      FALSE,
      'CNPJ já cadastrado no sistema'::TEXT;
    RETURN;
  END IF;

  -- Begin transaction
  BEGIN
    -- Insert academia
    INSERT INTO academias (
      nome,
      cnpj,
      telefone,
      email,
      endereco,
      horario_funcionamento,
      modalidades,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_nome,
      p_cnpj,
      p_telefone,
      p_email,
      p_endereco,
      p_horario_funcionamento,
      p_modalidades,
      p_status,
      NOW(),
      NOW()
    ) RETURNING id INTO v_academia_id;

    -- Return success
    RETURN QUERY SELECT 
      v_academia_id,
      'gym_owner',
      TRUE,
      'Academia criada com sucesso'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        NULL::UUID,
        NULL::TEXT,
        FALSE,
        'Erro ao criar academia: ' || SQLERRM::TEXT;
  END;
END;
$$;