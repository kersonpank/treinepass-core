-- Script para corrigir permissões da tabela asaas_webhook_events

-- 1. Verificar se a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_webhook_events') THEN
    RAISE EXCEPTION 'A tabela asaas_webhook_events não existe. Execute o script sql-final-para-supabase.sql primeiro.';
  END IF;
END
$$;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS admin_policy ON public.asaas_webhook_events;
DROP POLICY IF EXISTS service_role_policy ON public.asaas_webhook_events;
DROP POLICY IF EXISTS authenticated_policy ON public.asaas_webhook_events;

-- 4. Criar políticas de acesso

-- Política para usuários administradores
CREATE POLICY admin_policy ON public.asaas_webhook_events
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_types WHERE type = 'admin'
    )
  );

-- Política para o service_role (usado pela API e funções)
CREATE POLICY service_role_policy ON public.asaas_webhook_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Política para usuários autenticados (opcional, remova se não quiser permitir acesso a todos usuários autenticados)
-- CREATE POLICY authenticated_policy ON public.asaas_webhook_events
--   FOR SELECT
--   USING (auth.role() = 'authenticated');

-- 5. Garantir permissões corretas
GRANT ALL ON TABLE public.asaas_webhook_events TO postgres, service_role;
GRANT ALL ON FUNCTION public.reprocess_failed_webhook_event(uuid) TO postgres, service_role;

-- 6. Verificar se a função de reprocessamento existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'reprocess_failed_webhook_event'
  ) THEN
    RAISE EXCEPTION 'A função reprocess_failed_webhook_event não existe. Execute o script sql-final-para-supabase.sql primeiro.';
  END IF;
END
$$;

-- 7. Verificar se a função process_asaas_webhook existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'process_asaas_webhook'
  ) THEN
    RAISE EXCEPTION 'A função process_asaas_webhook não existe. Esta função é necessária para o reprocessamento de eventos.';
  END IF;
END
$$;

-- 8. Criar uma função de teste para verificar permissões
CREATE OR REPLACE FUNCTION public.test_webhook_events_access()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.asaas_webhook_events;
  RETURN 'Acesso bem-sucedido. Total de eventos: ' || event_count;
EXCEPTION WHEN OTHERS THEN
  RETURN 'Erro ao acessar a tabela: ' || SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_webhook_events_access() TO authenticated, service_role;

-- 9. Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Script de correção de permissões executado com sucesso!';
END
$$;
