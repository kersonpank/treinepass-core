-- Verificar se a tabela de eventos de webhook existe e criu00e1-la se nu00e3o existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_webhook_events') THEN
    CREATE TABLE public.asaas_webhook_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      event_data JSONB NOT NULL,
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      error_message TEXT,
      retry_count INTEGER DEFAULT 0
    );
    
    RAISE NOTICE 'Tabela asaas_webhook_events criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela asaas_webhook_events ju00e1 existe';
    
    -- Verificar se as colunas error_message e retry_count existem e adicionu00e1-las se nu00e3o existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'error_message') THEN
      ALTER TABLE public.asaas_webhook_events ADD COLUMN error_message TEXT;
      RAISE NOTICE 'Coluna error_message adicionada';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asaas_webhook_events' AND column_name = 'retry_count') THEN
      ALTER TABLE public.asaas_webhook_events ADD COLUMN retry_count INTEGER DEFAULT 0;
      RAISE NOTICE 'Coluna retry_count adicionada';
    END IF;
  END IF;
END
$$;

-- Criar u00edndices para melhorar a performance (nu00e3o du00e1 erro se ju00e1 existirem)
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_event_type 
  ON public.asaas_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_processed 
  ON public.asaas_webhook_events(processed);

-- Criar view para facilitar a anu00e1lise de eventos com erro
CREATE OR REPLACE VIEW public.asaas_webhook_events_with_errors AS
SELECT *
FROM public.asaas_webhook_events
WHERE processed = false
OR error_message IS NOT NULL
ORDER BY created_at DESC;

-- Criar funu00e7u00e3o para reprocessar eventos com erro
CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_event RECORD;
  result jsonb;
  process_function_exists BOOLEAN;
BEGIN
  -- Verificar se a funu00e7u00e3o process_asaas_webhook existe
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'process_asaas_webhook'
  ) INTO process_function_exists;
  
  IF NOT process_function_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'A funu00e7u00e3o process_asaas_webhook nu00e3o existe'
    );
  END IF;

  -- Obter os dados do evento
  SELECT * INTO webhook_event
  FROM public.asaas_webhook_events
  WHERE id = event_id;
  
  IF webhook_event IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Evento nu00e3o encontrado'
    );
  END IF;
  
  -- Reprocessar o evento
  EXECUTE 'SELECT public.process_asaas_webhook($1)' INTO result USING webhook_event.event_data;
  
  -- Atualizar o registro do evento
  UPDATE public.asaas_webhook_events
  SET processed = (result->>'success')::boolean,
      processed_at = NOW(),
      retry_count = retry_count + 1,
      error_message = CASE 
                        WHEN (result->>'success')::boolean THEN NULL 
                        ELSE result->>'message' 
                      END
  WHERE id = event_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Evento reprocessado',
    'result', result
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

-- Configurar as permissu00f5es de RLS (Row Level Security) para a tabela asaas_webhook_events
-- Primeiro, habilitar RLS na tabela
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

-- Criar polu00edtica para permitir que apenas administradores possam acessar a tabela
CREATE POLICY admin_policy ON public.asaas_webhook_events
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true));

-- Garantir permissu00f5es
GRANT ALL ON TABLE public.asaas_webhook_events TO postgres, service_role;
GRANT ALL ON FUNCTION public.reprocess_failed_webhook_event(uuid) TO postgres, service_role;

-- Criar uma polu00edtica alternativa se a coluna is_admin nu00e3o existir na tabela auth.users
-- Comentado por padru00e3o, descomente se necessu00e1rio
/*
DROP POLICY IF EXISTS admin_policy ON public.asaas_webhook_events;
CREATE POLICY admin_policy ON public.asaas_webhook_events FOR ALL TO authenticated
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE profiles.role = 'admin'
  ));
*/

-- Se a tabela nu00e3o tiver nenhuma polu00edtica de RLS, vamos criar uma polu00edtica que permite acesso apenas ao service_role
-- Isso u00e9 mais seguro do que deixar a tabela acessu00edvel a todos
CREATE POLICY service_role_policy ON public.asaas_webhook_events
  USING (current_setting('role') = 'service_role');
