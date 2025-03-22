-- Script para corrigir a ambiguidade da coluna event_id na função reprocess_failed_webhook_event

-- Verificar se a função existe
DO $$
DECLARE
    func_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'reprocess_failed_webhook_event'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE 'Atualizando função reprocess_failed_webhook_event...';
        
        -- Criar ou substituir a função
        EXECUTE $FUNC$
        CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(webhook_event_id UUID)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $BODY$
        DECLARE
            webhook_event RECORD;
            result JSONB;
        BEGIN
            -- Obter os dados do evento
            SELECT * INTO webhook_event
            FROM public.asaas_webhook_events
            WHERE id = webhook_event_id;
            
            IF webhook_event IS NULL THEN
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'message', 'Evento não encontrado'
                );
            END IF;
            
            -- Usar o campo payload se existir, caso contrário usar event_data
            IF webhook_event.payload IS NOT NULL THEN
                -- Reprocessar o evento
                result := public.process_asaas_webhook(webhook_event.payload);
            ELSIF webhook_event.event_data IS NOT NULL THEN
                -- Compatibilidade com versão anterior
                result := public.process_asaas_webhook(webhook_event.event_data);
            ELSE
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'message', 'Evento não contém dados para reprocessamento'
                );
            END IF;
            
            -- Atualizar o registro do evento
            UPDATE public.asaas_webhook_events
            SET processed = (result->>'success')::BOOLEAN,
                processed_at = NOW(),
                retry_count = COALESCE(retry_count, 0) + 1,
                error_message = CASE 
                                WHEN (result->>'success')::BOOLEAN THEN NULL 
                                ELSE result->>'error' 
                                END
            WHERE id = webhook_event_id;
            
            RETURN jsonb_build_object(
                'success', TRUE,
                'message', 'Evento reprocessado',
                'result', result
            );
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'message', SQLERRM
            );
        END;
        $BODY$;
        $FUNC$;
        
        -- Atualizar permissões
        REVOKE ALL ON FUNCTION public.reprocess_failed_webhook_event(UUID) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.reprocess_failed_webhook_event(UUID) TO service_role;
        
        RAISE NOTICE 'Função reprocess_failed_webhook_event atualizada com sucesso.';
    ELSE
        RAISE NOTICE 'Função reprocess_failed_webhook_event não existe. Criando...';
        
        -- Criar a função
        EXECUTE $FUNC$
        CREATE OR REPLACE FUNCTION public.reprocess_failed_webhook_event(webhook_event_id UUID)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $BODY$
        DECLARE
            webhook_event RECORD;
            result JSONB;
        BEGIN
            -- Obter os dados do evento
            SELECT * INTO webhook_event
            FROM public.asaas_webhook_events
            WHERE id = webhook_event_id;
            
            IF webhook_event IS NULL THEN
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'message', 'Evento não encontrado'
                );
            END IF;
            
            -- Usar o campo payload se existir, caso contrário usar event_data
            IF webhook_event.payload IS NOT NULL THEN
                -- Reprocessar o evento
                result := public.process_asaas_webhook(webhook_event.payload);
            ELSIF webhook_event.event_data IS NOT NULL THEN
                -- Compatibilidade com versão anterior
                result := public.process_asaas_webhook(webhook_event.event_data);
            ELSE
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'message', 'Evento não contém dados para reprocessamento'
                );
            END IF;
            
            -- Atualizar o registro do evento
            UPDATE public.asaas_webhook_events
            SET processed = (result->>'success')::BOOLEAN,
                processed_at = NOW(),
                retry_count = COALESCE(retry_count, 0) + 1,
                error_message = CASE 
                                WHEN (result->>'success')::BOOLEAN THEN NULL 
                                ELSE result->>'error' 
                                END
            WHERE id = webhook_event_id;
            
            RETURN jsonb_build_object(
                'success', TRUE,
                'message', 'Evento reprocessado',
                'result', result
            );
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'message', SQLERRM
            );
        END;
        $BODY$;
        $FUNC$;
        
        -- Atualizar permissões
        REVOKE ALL ON FUNCTION public.reprocess_failed_webhook_event(UUID) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.reprocess_failed_webhook_event(UUID) TO service_role;
        
        RAISE NOTICE 'Função reprocess_failed_webhook_event criada com sucesso.';
    END IF;
END;
$$;
