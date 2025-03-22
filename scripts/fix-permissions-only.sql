-- Script para corrigir apenas as permissões da tabela asaas_customers

-- 1. Corrigir permissões da tabela asaas_customers
DO $$
BEGIN
  -- Garantir que a tabela tenha as permissões corretas
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.asaas_customers TO service_role;
    RAISE NOTICE 'Permissões da tabela asaas_customers atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar permissões da tabela asaas_customers: %', SQLERRM;
  END;
  
  -- Verificar e corrigir as políticas RLS
  BEGIN
    ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Usuários autenticados podem ler seus próprios registros" ON public.asaas_customers;
    DROP POLICY IF EXISTS "Usuários autenticados podem inserir seus próprios registros" ON public.asaas_customers;
    DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seus próprios registros" ON public.asaas_customers;
    
    -- Criar novas políticas
    CREATE POLICY "Usuários autenticados podem ler seus próprios registros"
    ON public.asaas_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
    CREATE POLICY "Usuários autenticados podem inserir seus próprios registros"
    ON public.asaas_customers
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Usuários autenticados podem atualizar seus próprios registros"
    ON public.asaas_customers
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
    
    RAISE NOTICE 'Políticas RLS da tabela asaas_customers atualizadas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar políticas RLS da tabela asaas_customers: %', SQLERRM;
  END;
END;
$$;
