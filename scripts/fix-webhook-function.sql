-- Script para corrigir a função process_asaas_webhook e a estrutura da tabela

-- 1. Verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'asaas_webhook_events';

-- 2. Modificar a função process_asaas_webhook para lidar com o caso onde o ID do evento não está presente
CREATE OR REPLACE FUNCTION public.process_asaas_webhook(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_data jsonb;
    subscription_data jsonb;
    payment_status text;
    payment_record record;
    subscription_record record;
    webhook_event_id uuid;
    checkout_session record;
    event_type text;
    event_id text;
BEGIN
    -- Log inicial
    RAISE NOTICE 'Processando webhook do Asaas: %', payload;

    -- Extrair tipo de evento
    event_type := payload->>'event';
    
    -- Gerar um ID de evento se não estiver presente
    event_id := payload->>'id';
    IF event_id IS NULL THEN
        event_id := 'evt_' || md5(payload::text) || '&' || floor(random() * 10000000);
    END IF;
    
    -- Registrar o evento do webhook
    INSERT INTO public.asaas_webhook_events (
        event_id,
        event_type,
        payment_id,
        subscription_id,
        customer_id,
        payload,
        processed,
        processed_at
    ) VALUES (
        event_id,
        event_type,
        CASE WHEN event_type LIKE 'PAYMENT%' THEN (payload->'payment'->>'id')::text ELSE NULL END,
        CASE WHEN event_type LIKE 'SUBSCRIPTION%' THEN (payload->'subscription'->>'id')::text ELSE NULL END,
        CASE 
            WHEN event_type LIKE 'PAYMENT%' THEN (payload->'payment'->>'customer')::text
            WHEN event_type LIKE 'SUBSCRIPTION%' THEN (payload->'subscription'->>'customer')::text
            ELSE NULL
        END,
        payload,
        false,
        NULL
    ) RETURNING id INTO webhook_event_id;

    -- Processar diferentes tipos de eventos
    CASE event_type
        WHEN 'SUBSCRIPTION_CREATED' THEN
            subscription_data := payload->'subscription';
            -- Registrar histórico inicial
            PERFORM record_subscription_history(
                (subscription_data->>'externalReference')::UUID,
                (SELECT user_id FROM asaas_customers WHERE asaas_id = subscription_data->>'customer'),
                (SELECT plan_id FROM subscriptions WHERE id = (subscription_data->>'externalReference')::UUID),
                'pending',
                'pending',
                NOW(),
                (subscription_data->>'nextDueDate')::TIMESTAMP WITH TIME ZONE
            );

        WHEN 'PAYMENT_CREATED' THEN
            payment_data := payload->'payment';
            -- Buscar pagamento no nosso sistema
            SELECT * INTO payment_record
            FROM asaas_payments
            WHERE asaas_id = (payment_data->>'id');

            IF FOUND THEN
                -- Atualizar status do pagamento
                UPDATE asaas_payments
                SET 
                    status = 'PENDING',
                    billing_type = payment_data->>'billingType',
                    updated_at = NOW()
                WHERE id = payment_record.id;

                -- Atualizar histórico
                UPDATE subscription_history
                SET 
                    payment_status = 'pending',
                    updated_at = NOW()
                WHERE subscription_id = payment_record.subscription_id
                AND end_date IS NULL;
            END IF;

        WHEN 'PAYMENT_RECEIVED' THEN
            payment_data := payload->'payment';
            -- Buscar pagamento no nosso sistema
            SELECT * INTO payment_record
            FROM asaas_payments
            WHERE asaas_id = (payment_data->>'id');

            IF FOUND THEN
                -- Atualizar status do pagamento
                UPDATE asaas_payments
                SET 
                    status = 'RECEIVED',
                    billing_type = payment_data->>'billingType',
                    updated_at = NOW()
                WHERE id = payment_record.id;

                -- Buscar assinatura
                SELECT * INTO subscription_record
                FROM subscriptions
                WHERE id = payment_record.subscription_id;

                IF FOUND THEN
                    -- Atualizar status da assinatura
                    UPDATE subscriptions
                    SET 
                        status = 'active',
                        payment_status = 'paid',
                        updated_at = NOW()
                    WHERE id = subscription_record.id;

                    -- Atualizar histórico
                    UPDATE subscription_history
                    SET 
                        status = 'active',
                        payment_status = 'paid',
                        updated_at = NOW()
                    WHERE subscription_id = subscription_record.id
                    AND end_date IS NULL;

                    -- Atualizar status da sessão de checkout
                    UPDATE checkout_sessions
                    SET 
                        status = 'completed',
                        updated_at = NOW()
                    WHERE payment_id = payment_record.id;
                END IF;
            END IF;
            
        WHEN 'PAYMENT_CONFIRMED' THEN
            payment_data := payload->'payment';
            -- Buscar pagamento no nosso sistema
            SELECT * INTO payment_record
            FROM asaas_payments
            WHERE asaas_id = (payment_data->>'id');

            IF FOUND THEN
                -- Atualizar status do pagamento
                UPDATE asaas_payments
                SET 
                    status = 'CONFIRMED',
                    billing_type = payment_data->>'billingType',
                    updated_at = NOW()
                WHERE id = payment_record.id;

                -- Buscar assinatura
                SELECT * INTO subscription_record
                FROM subscriptions
                WHERE id = payment_record.subscription_id;

                IF FOUND THEN
                    -- Atualizar status da assinatura
                    UPDATE subscriptions
                    SET 
                        status = 'active',
                        payment_status = 'paid',
                        updated_at = NOW()
                    WHERE id = subscription_record.id;

                    -- Atualizar histórico
                    UPDATE subscription_history
                    SET 
                        status = 'active',
                        payment_status = 'paid',
                        updated_at = NOW()
                    WHERE subscription_id = subscription_record.id
                    AND end_date IS NULL;

                    -- Atualizar status da sessão de checkout
                    UPDATE checkout_sessions
                    SET 
                        status = 'completed',
                        updated_at = NOW()
                    WHERE payment_id = payment_record.id;
                ELSE
                    -- Caso o pagamento não seja encontrado, apenas registrar o evento
                    RAISE NOTICE 'Pagamento não encontrado no sistema: %', payment_data->>'id';
                END IF;
            END IF;
            
        ELSE
            -- Caso para eventos desconhecidos ou não tratados
            RAISE NOTICE 'Evento não tratado: %', event_type;
    END CASE;

    -- Marcar evento como processado
    UPDATE public.asaas_webhook_events
    SET 
        processed = true,
        processed_at = NOW()
    WHERE id = webhook_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'webhook_event_id', webhook_event_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Se houver erro, marcar evento como não processado
    IF webhook_event_id IS NOT NULL THEN
        UPDATE public.asaas_webhook_events
        SET 
            processed = false,
            processed_at = NOW(),
            error_message = SQLERRM
        WHERE id = webhook_event_id;
    END IF;

    RAISE NOTICE 'Erro ao processar webhook: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'webhook_event_id', webhook_event_id
    );
END;
$$;
