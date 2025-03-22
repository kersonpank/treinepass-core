-- Script para criar a tabela de registros financeiros de check-in

-- Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'gym_check_in_financial_records'
    ) THEN
        -- Criar a tabela se nu00e3o existir
        CREATE TABLE public.gym_check_in_financial_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            check_in_id UUID NOT NULL REFERENCES public.gym_check_ins(id) ON DELETE CASCADE,
            plan_id UUID NOT NULL,
            valor_repasse NUMERIC(10,2) NOT NULL DEFAULT 0,
            valor_plano NUMERIC(10,2) NOT NULL DEFAULT 0,
            status_pagamento VARCHAR(50) NOT NULL DEFAULT 'pending',
            data_processamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT valid_status_pagamento CHECK (status_pagamento IN ('pending', 'processed', 'failed', 'refunded'))
        );

        -- Criar u00edndices para melhor performance
        CREATE INDEX gym_check_in_financial_records_check_in_id_idx ON public.gym_check_in_financial_records(check_in_id);
        CREATE INDEX gym_check_in_financial_records_plan_id_idx ON public.gym_check_in_financial_records(plan_id);
        CREATE INDEX gym_check_in_financial_records_status_pagamento_idx ON public.gym_check_in_financial_records(status_pagamento);
        CREATE INDEX gym_check_in_financial_records_data_processamento_idx ON public.gym_check_in_financial_records(data_processamento);

        -- Habilitar RLS
        ALTER TABLE public.gym_check_in_financial_records ENABLE ROW LEVEL SECURITY;

        -- Polu00edticas de segurancu00e7a
        CREATE POLICY "Administradores podem ver todos os registros financeiros"
            ON public.gym_check_in_financial_records FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_id = auth.uid()
                    AND role = 'admin'
                )
            );

        CREATE POLICY "Academias podem ver registros financeiros de seus check-ins"
            ON public.gym_check_in_financial_records FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM gym_check_ins ci
                    JOIN user_gym_roles ugr ON ci.academia_id = ugr.gym_id
                    WHERE ci.id = gym_check_in_financial_records.check_in_id
                    AND ugr.user_id = auth.uid()
                    AND ugr.active = true
                )
            );

        RAISE NOTICE 'Tabela gym_check_in_financial_records criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela gym_check_in_financial_records ju00e1 existe.';
    END IF;
END
$$;
