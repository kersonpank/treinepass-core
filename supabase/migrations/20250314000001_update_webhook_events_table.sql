-- Adicionar campos para melhorar o rastreamento de eventos de webhook
ALTER TABLE public.asaas_webhook_events 
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;

-- Criar índice para melhorar a performance de consultas por tipo de evento
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_event_type 
  ON public.asaas_webhook_events(event_type);

-- Criar índice para melhorar a performance de consultas por status de processamento
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_processed 
  ON public.asaas_webhook_events(processed);

-- Criar uma view para facilitar a análise de eventos com erro
CREATE OR REPLACE VIEW public.asaas_webhook_events_with_errors AS
SELECT *
FROM public.asaas_webhook_events
WHERE processed = false
OR error_message IS NOT NULL
ORDER BY created_at DESC;

-- Criar uma função para reprocessar eventos com erro
CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_data jsonb;
  result jsonb;
BEGIN
  -- Obter os dados do evento
  SELECT event_data INTO event_data
  FROM public.asaas_webhook_events
  WHERE id = event_id;
  
  IF event_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Evento não encontrado'
    );
  END IF;
  
  -- Reprocessar o evento
  result := public.process_asaas_webhook(event_data);
  
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

-- Ensure permissions
REVOKE ALL ON FUNCTION public.reprocess_failed_webhook_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reprocess_failed_webhook_event(uuid) TO service_role;
