-- Criar tabela de eventos de webhook se nu00e3o existir
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Criar u00edndices para melhorar a performance
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

-- Criar funu00e7u00e3o para processar eventos de webhook
CREATE OR REPLACE FUNCTION public.process_asaas_webhook(event_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_type TEXT;
  payment_data JSONB;
  subscription_data JSONB;
  customer_data JSONB;
  payment_id TEXT;
  payment_status TEXT;
  subscription_id TEXT;
  subscription_status TEXT;
  customer_id TEXT;
  user_id UUID;
  plan_id UUID;
  result JSONB;
  log_message TEXT;
  error_message TEXT;
BEGIN
  -- Extract event type
  event_type := event_data->>'event';
  
  -- Log the start of processing
  log_message := 'Processing webhook event: ' || event_type;
  RAISE NOTICE '%', log_message;
  
  -- Extract data based on event type
  payment_data := event_data->'payment';
  subscription_data := event_data->'subscription';
  customer_data := event_data->'customer';
  
  -- Initialize result
  result := jsonb_build_object(
    'success', true,
    'event_type', event_type,
    'message', 'Event processed successfully'
  );
  
  -- Handle payment events
  IF event_type LIKE 'PAYMENT_%' AND payment_data IS NOT NULL THEN
    payment_id := payment_data->>'id';
    payment_status := payment_data->>'status';
    
    -- Find the user_id and plan_id based on the payment's externalReference
    BEGIN
      SELECT bp.id, bp.user_id INTO plan_id, user_id
      FROM benefit_plans bp
      WHERE bp.payment_id = payment_id;
      
      IF plan_id IS NULL THEN
        -- Try to find by external reference
        SELECT bp.id, bp.user_id INTO plan_id, user_id
        FROM benefit_plans bp
        WHERE bp.external_reference = payment_data->>'externalReference';
      END IF;
      
      -- Update the plan status based on payment status
      IF plan_id IS NOT NULL THEN
        IF payment_status = 'CONFIRMED' OR payment_status = 'RECEIVED' THEN
          -- Payment confirmed, activate the plan
          UPDATE benefit_plans
          SET status = 'active',
              updated_at = NOW(),
              payment_status = payment_status
          WHERE id = plan_id;
          
          result := result || jsonb_build_object('plan_updated', true, 'new_status', 'active');
        ELSIF payment_status = 'OVERDUE' THEN
          -- Payment overdue, mark the plan as overdue
          UPDATE benefit_plans
          SET status = 'overdue',
              updated_at = NOW(),
              payment_status = payment_status
          WHERE id = plan_id;
          
          result := result || jsonb_build_object('plan_updated', true, 'new_status', 'overdue');
        ELSIF payment_status = 'REFUNDED' OR payment_status = 'DELETED' THEN
          -- Payment refunded or deleted, cancel the plan
          UPDATE benefit_plans
          SET status = 'cancelled',
              updated_at = NOW(),
              payment_status = payment_status
          WHERE id = plan_id;
          
          result := result || jsonb_build_object('plan_updated', true, 'new_status', 'cancelled');
        ELSE
          -- Other payment status, just update the payment_status
          UPDATE benefit_plans
          SET updated_at = NOW(),
              payment_status = payment_status
          WHERE id = plan_id;
          
          result := result || jsonb_build_object('plan_updated', true, 'payment_status_updated', true);
        END IF;
      ELSE
        -- No plan found for this payment
        result := jsonb_build_object(
          'success', false,
          'message', 'No plan found for payment ID: ' || payment_id
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      error_message := 'Error processing payment event: ' || SQLERRM;
      RAISE NOTICE '%', error_message;
      
      result := jsonb_build_object(
        'success', false,
        'message', error_message
      );
    END;
  END IF;
  
  -- Handle subscription events
  IF event_type LIKE 'SUBSCRIPTION_%' AND subscription_data IS NOT NULL THEN
    subscription_id := subscription_data->>'id';
    subscription_status := subscription_data->>'status';
    
    -- Find the user_id and plan_id based on the subscription ID
    BEGIN
      SELECT bp.id, bp.user_id INTO plan_id, user_id
      FROM benefit_plans bp
      WHERE bp.subscription_id = subscription_id;
      
      IF plan_id IS NULL THEN
        -- Try to find by external reference
        SELECT bp.id, bp.user_id INTO plan_id, user_id
        FROM benefit_plans bp
        WHERE bp.external_reference = subscription_data->>'externalReference';
      END IF;
      
      -- Update the plan based on subscription status
      IF plan_id IS NOT NULL THEN
        IF subscription_status = 'ACTIVE' THEN
          -- Subscription active, ensure plan is active
          UPDATE benefit_plans
          SET status = 'active',
              updated_at = NOW(),
              subscription_status = subscription_status
          WHERE id = plan_id;
          
          result := result || jsonb_build_object('plan_updated', true, 'new_status', 'active');
        ELSIF subscription_status = 'INACTIVE' THEN
          -- Subscription inactive, cancel the plan
          UPDATE benefit_plans
          SET status = 'cancelled',
              updated_at = NOW(),
              subscription_status = subscription_status
          WHERE id = plan_id;
          
          result := result || jsonb_build_object('plan_updated', true, 'new_status', 'cancelled');
        ELSE
          -- Other subscription status, just update the subscription_status
          UPDATE benefit_plans
          SET updated_at = NOW(),
              subscription_status = subscription_status
          WHERE id = plan_id;
          
          result := result || jsonb_build_object('plan_updated', true, 'subscription_status_updated', true);
        END IF;
      ELSE
        -- No plan found for this subscription
        result := jsonb_build_object(
          'success', false,
          'message', 'No plan found for subscription ID: ' || subscription_id
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      error_message := 'Error processing subscription event: ' || SQLERRM;
      RAISE NOTICE '%', error_message;
      
      result := jsonb_build_object(
        'success', false,
        'message', error_message
      );
    END;
  END IF;
  
  -- Handle customer events
  IF event_type LIKE 'CUSTOMER_%' AND customer_data IS NOT NULL THEN
    customer_id := customer_data->>'id';
    
    -- Find the user_id based on the customer ID
    BEGIN
      SELECT up.id INTO user_id
      FROM user_profiles up
      WHERE up.payment_customer_id = customer_id;
      
      IF user_id IS NULL THEN
        -- Try to find by external reference
        SELECT up.id INTO user_id
        FROM user_profiles up
        WHERE up.external_id = customer_data->>'externalReference';
      END IF;
      
      -- Update user profile based on customer data
      IF user_id IS NOT NULL THEN
        IF event_type = 'CUSTOMER_UPDATED' THEN
          -- Update user profile with customer data
          UPDATE user_profiles
          SET updated_at = NOW(),
              email = COALESCE(customer_data->>'email', email),
              phone = COALESCE(customer_data->>'mobilePhone', customer_data->>'phone', phone)
          WHERE id = user_id;
          
          result := result || jsonb_build_object('user_updated', true);
        ELSIF event_type = 'CUSTOMER_DELETED' THEN
          -- Mark customer ID as null
          UPDATE user_profiles
          SET payment_customer_id = NULL,
              updated_at = NOW()
          WHERE id = user_id;
          
          result := result || jsonb_build_object('user_updated', true, 'customer_id_removed', true);
        END IF;
      ELSE
        -- No user found for this customer
        result := jsonb_build_object(
          'success', false,
          'message', 'No user found for customer ID: ' || customer_id
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      error_message := 'Error processing customer event: ' || SQLERRM;
      RAISE NOTICE '%', error_message;
      
      result := jsonb_build_object(
        'success', false,
        'message', error_message
      );
    END;
  END IF;
  
  -- Return the result
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  error_message := 'Unexpected error processing webhook: ' || SQLERRM;
  RAISE NOTICE '%', error_message;
  
  RETURN jsonb_build_object(
    'success', false,
    'message', error_message
  );
END;
$$;

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
BEGIN
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
  result := public.process_asaas_webhook(webhook_event.event_data);
  
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

-- Garantir permissu00f5es
GRANT ALL ON TABLE public.asaas_webhook_events TO postgres, service_role;
GRANT ALL ON FUNCTION public.process_asaas_webhook(jsonb) TO postgres, service_role;
GRANT ALL ON FUNCTION public.reprocess_failed_webhook_event(uuid) TO postgres, service_role;
