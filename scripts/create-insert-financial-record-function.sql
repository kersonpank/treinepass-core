-- Criar funu00e7u00e3o para inserir registros financeiros de check-in

CREATE OR REPLACE FUNCTION public.insert_financial_record(
  p_check_in_id UUID,
  p_plan_id UUID,
  p_valor_repasse NUMERIC,
  p_valor_plano NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record_id UUID;
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'gym_check_in_financial_records'
  ) THEN
    -- Criar a tabela se nu00e3o existir
    CREATE TABLE public.gym_check_in_financial_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      check_in_id UUID NOT NULL,
      plan_id UUID,
      valor_repasse NUMERIC(10,2) NOT NULL DEFAULT 0,
      valor_plano NUMERIC(10,2) NOT NULL DEFAULT 0,
      status_pagamento VARCHAR(50) NOT NULL DEFAULT 'processed',
      data_processamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    -- Criar u00edndices
    CREATE INDEX IF NOT EXISTS gym_check_in_financial_records_check_in_id_idx 
      ON public.gym_check_in_financial_records(check_in_id);
    
    -- Habilitar RLS
    ALTER TABLE public.gym_check_in_financial_records ENABLE ROW LEVEL SECURITY;

    -- Polu00edtica bu00e1sica
    CREATE POLICY "Usuu00e1rios podem ver seus pru00f3prios registros financeiros"
      ON public.gym_check_in_financial_records FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM gym_check_ins
          WHERE id = gym_check_in_financial_records.check_in_id
          AND user_id = auth.uid()
        )
      );
  END IF;

  -- Inserir o registro
  INSERT INTO public.gym_check_in_financial_records (
    check_in_id,
    plan_id,
    valor_repasse,
    valor_plano,
    status_pagamento,
    data_processamento
  ) VALUES (
    p_check_in_id,
    p_plan_id,
    p_valor_repasse,
    p_valor_plano,
    'processed',
    NOW()
  ) RETURNING id INTO v_record_id;

  RETURN v_record_id;
END;
$$;

-- Garantir que a funu00e7u00e3o tenha as permissu00f5es corretas
GRANT EXECUTE ON FUNCTION public.insert_financial_record(UUID, UUID, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_financial_record(UUID, UUID, NUMERIC, NUMERIC) TO service_role;
