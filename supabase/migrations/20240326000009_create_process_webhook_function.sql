CREATE OR REPLACE FUNCTION public.process_asaas_webhook(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_data jsonb;
  subscription_data jsonb;
  subscription_id uuid;
  payment_status text;
  payment_record record;
  subscription_record record;
  webhook_event_id uuid;
  asaas_payment_id text;
  event_type text;
  asaas_subscription_id text;
  next_payment_date date;
  customer_data jsonb;
  customer_id text;
  log_message text;
  retry_count int;
BEGIN
  -- Initial logging
  RAISE NOTICE 'Processing Asaas webhook: %', payload;

  -- Extract payment data and event type
  payment_data := payload->'payment';
  subscription_data := payload->'subscription';
  customer_data := payload->'customer';
  event_type := payload->>'event';
  
  -- Register the webhook event
  INSERT INTO public.asaas_webhook_events (
    event_type,
    event_data,
    processed,
    processed_at
  ) VALUES (
    event_type,
    payload,
    false,
    NULL
  ) RETURNING id INTO webhook_event_id;

  -- Adicionar campo para mensagem de log se não existir
  BEGIN
    ALTER TABLE public.asaas_webhook_events ADD COLUMN IF NOT EXISTS error_message text;
    ALTER TABLE public.asaas_webhook_events ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;
  EXCEPTION WHEN OTHERS THEN
    -- Ignora erro se a coluna já existir
    RAISE NOTICE 'Columns may already exist: %', SQLERRM;
  END;

  -- Handle customer events
  IF event_type LIKE 'CUSTOMER_%' AND customer_data IS NOT NULL THEN
    customer_id := customer_data->>'id';
    
    -- Log customer event
    RAISE NOTICE 'Processing customer event: % for customer %', event_type, customer_id;
    
    -- Update customer information if needed
    IF event_type = 'CUSTOMER_UPDATED' OR event_type = 'CUSTOMER_CREATED' THEN
      -- Verificar se o cliente já existe
      DECLARE
        customer_exists boolean;
      BEGIN
        SELECT EXISTS(SELECT 1 FROM asaas_customers WHERE asaas_id = customer_id) INTO customer_exists;
        
        IF customer_exists THEN
          -- Atualizar cliente existente
          UPDATE asaas_customers
          SET 
            name = customer_data->>'name',
            email = customer_data->>'email',
            phone = customer_data->>'phone',
            mobile_phone = customer_data->>'mobilePhone',
            cpf_cnpj = customer_data->>'cpfCnpj',
            postal_code = customer_data->>'postalCode',
            address = customer_data->>'address',
            address_number = customer_data->>'addressNumber',
            complement = customer_data->>'complement',
            province = customer_data->>'province',
            external_reference = customer_data->>'externalReference',
            updated_at = NOW()
          WHERE asaas_id = customer_id;
          
          log_message := 'Customer updated: ' || customer_id;
          RAISE NOTICE '%', log_message;
        ELSE
          -- Inserir novo cliente
          INSERT INTO asaas_customers (
            asaas_id,
            name,
            email,
            phone,
            mobile_phone,
            cpf_cnpj,
            postal_code,
            address,
            address_number,
            complement,
            province,
            external_reference
          ) VALUES (
            customer_id,
            customer_data->>'name',
            customer_data->>'email',
            customer_data->>'phone',
            customer_data->>'mobilePhone',
            customer_data->>'cpfCnpj',
            customer_data->>'postalCode',
            customer_data->>'address',
            customer_data->>'addressNumber',
            customer_data->>'complement',
            customer_data->>'province',
            customer_data->>'externalReference'
          );
          
          log_message := 'Customer created: ' || customer_id;
          RAISE NOTICE '%', log_message;
        END IF;
      END;
    ELSIF event_type = 'CUSTOMER_DELETED' THEN
      -- Apenas registrar o evento, não excluir o cliente do banco
      log_message := 'Customer deleted event received for: ' || customer_id;
      RAISE NOTICE '%', log_message;
    END IF;
  END IF;

  -- Handle subscription events
  IF event_type LIKE 'SUBSCRIPTION_%' AND subscription_data IS NOT NULL THEN
    asaas_subscription_id := subscription_data->>'id';
    
    -- Find the subscription in our system
    SELECT * INTO subscription_record
    FROM user_plan_subscriptions
    WHERE asaas_subscription_id = asaas_subscription_id;
    
    IF FOUND THEN
      -- Update subscription based on event type
      IF event_type = 'SUBSCRIPTION_CREATED' OR event_type = 'SUBSCRIPTION_UPDATED' THEN
        UPDATE user_plan_subscriptions
        SET 
          status = CASE 
            WHEN subscription_data->>'status' = 'ACTIVE' THEN 'active'
            WHEN subscription_data->>'status' = 'INACTIVE' THEN 'inactive'
            ELSE status
          END,
          updated_at = NOW()
        WHERE id = subscription_record.id;
        
        log_message := 'Subscription updated: ' || subscription_record.id;
        RAISE NOTICE '%', log_message;
      ELSIF event_type = 'SUBSCRIPTION_DELETED' OR event_type = 'SUBSCRIPTION_INACTIVATED' THEN
        UPDATE user_plan_subscriptions
        SET 
          status = 'cancelled',
          updated_at = NOW()
        WHERE id = subscription_record.id;
        
        log_message := 'Subscription cancelled: ' || subscription_record.id;
        RAISE NOTICE '%', log_message;
      ELSIF event_type = 'SUBSCRIPTION_RENEWED' THEN
        -- Atualizar data da próxima renovação
        IF subscription_data->>'nextDueDate' IS NOT NULL THEN
          UPDATE user_plan_subscriptions
          SET 
            next_payment_date = (subscription_data->>'nextDueDate')::date,
            updated_at = NOW()
          WHERE id = subscription_record.id;
          
          log_message := 'Subscription renewed: ' || subscription_record.id;
          RAISE NOTICE '%', log_message;
        END IF;
      END IF;
    ELSE
      -- Subscription not found, log warning
      log_message := 'Subscription not found: ' || asaas_subscription_id;
      RAISE WARNING '%', log_message;
    END IF;
  END IF;

  -- Handle payment events
  IF event_type LIKE 'PAYMENT_%' AND payment_data IS NOT NULL THEN
    asaas_payment_id := payment_data->>'id';
    asaas_subscription_id := payment_data->>'subscription';
    
    -- Map Asaas payment status to our internal status
    payment_status := CASE payment_data->>'status'
      WHEN 'CONFIRMED' THEN 'paid'
      WHEN 'RECEIVED' THEN 'paid'
      WHEN 'RECEIVED_IN_CASH' THEN 'paid'
      WHEN 'PAYMENT_APPROVED_BY_RISK_ANALYSIS' THEN 'paid'
      WHEN 'PENDING' THEN 'pending'
      WHEN 'AWAITING_RISK_ANALYSIS' THEN 'pending'
      WHEN 'AWAITING_CHARGEBACK_REVERSAL' THEN 'pending'
      WHEN 'OVERDUE' THEN 'overdue'
      WHEN 'REFUNDED' THEN 'refunded'
      WHEN 'REFUND_REQUESTED' THEN 'refunded'
      WHEN 'REFUND_IN_PROGRESS' THEN 'refunded'
      WHEN 'PARTIALLY_REFUNDED' THEN 'refunded'
      WHEN 'CHARGEBACK_REQUESTED' THEN 'refunded'
      WHEN 'CHARGEBACK_DISPUTE' THEN 'refunded'
      WHEN 'DUNNING_REQUESTED' THEN 'overdue'
      WHEN 'DUNNING_RECEIVED' THEN 'overdue'
      WHEN 'CANCELLED' THEN 'cancelled'
      WHEN 'PAYMENT_DELETED' THEN 'cancelled'
      WHEN 'PAYMENT_REPROVED_BY_RISK_ANALYSIS' THEN 'failed'
      ELSE 'pending'
    END;

    -- Find the payment record in our system by Asaas ID
    SELECT * INTO payment_record
    FROM asaas_payments
    WHERE asaas_id = asaas_payment_id;

    -- If payment not found by ID, try to find by external reference (subscription ID)
    IF NOT FOUND AND payment_data->>'externalReference' IS NOT NULL THEN
      SELECT * INTO payment_record
      FROM asaas_payments
      WHERE external_reference = payment_data->>'externalReference';
    END IF;
    
    -- If payment still not found, create a new payment record
    IF NOT FOUND THEN
      INSERT INTO asaas_payments (
        asaas_id,
        status,
        billing_type,
        amount,
        net_amount,
        due_date,
        payment_date,
        external_reference,
        invoice_url,
        payment_link
      ) VALUES (
        asaas_payment_id,
        payment_data->>'status',
        payment_data->>'billingType',
        (payment_data->>'value')::numeric,
        (payment_data->>'netValue')::numeric,
        (payment_data->>'dueDate')::date,
        CASE 
          WHEN payment_status = 'paid' THEN (payment_data->>'paymentDate')::date
          ELSE NULL
        END,
        payment_data->>'externalReference',
        payment_data->>'invoiceUrl',
        payment_data->>'invoiceUrl'
      ) RETURNING * INTO payment_record;
      
      -- If we have an external reference (should be our subscription ID), link payment to subscription
      IF payment_data->>'externalReference' IS NOT NULL THEN
        -- Try to find the subscription by ID
        SELECT id INTO subscription_id
        FROM user_plan_subscriptions
        WHERE id::text = payment_data->>'externalReference';
        
        -- If found, update the payment with the subscription ID
        IF subscription_id IS NOT NULL THEN
          UPDATE asaas_payments
          SET subscription_id = subscription_id
          WHERE id = payment_record.id;
          
          -- Reload payment record to get subscription_id
          SELECT * INTO payment_record
          FROM asaas_payments
          WHERE id = payment_record.id;
        END IF;
      END IF;
    END IF;

    -- Update payment status and details
    UPDATE asaas_payments
    SET 
      status = payment_data->>'status',
      billing_type = payment_data->>'billingType',
      payment_date = CASE 
        WHEN payment_status = 'paid' THEN (payment_data->>'paymentDate')::date
        ELSE payment_date
      END,
      invoice_url = COALESCE(payment_data->>'invoiceUrl', invoice_url),
      payment_link = COALESCE(payment_data->>'invoiceUrl', payment_link),
      updated_at = NOW()
    WHERE id = payment_record.id;
    
    -- If the payment is linked to a subscription, get the subscription ID
    IF payment_record.subscription_id IS NOT NULL THEN
      subscription_id := payment_record.subscription_id;
    END IF;

    -- If no subscription_id in payment record but we have Asaas subscription ID, find the subscription
    IF subscription_id IS NULL AND asaas_subscription_id IS NOT NULL THEN
      SELECT id INTO subscription_id
      FROM user_plan_subscriptions
      WHERE asaas_subscription_id = asaas_subscription_id;
      
      -- If found, update payment record with subscription_id
      IF subscription_id IS NOT NULL THEN
        UPDATE asaas_payments
        SET subscription_id = subscription_id
        WHERE id = payment_record.id;
      END IF;
    END IF;
  
    -- If we found a subscription, update its status based on payment status
    IF subscription_id IS NOT NULL THEN
      SELECT * INTO subscription_record
      FROM user_plan_subscriptions
      WHERE id = subscription_id;

      IF FOUND THEN
        -- Calculate next payment date as 30 days from current due date
        IF payment_data->>'dueDate' IS NOT NULL THEN
          next_payment_date := (payment_data->>'dueDate')::date + interval '30 days';
        ELSIF subscription_record.next_payment_date IS NOT NULL THEN
          next_payment_date := subscription_record.next_payment_date::date;
        ELSE
          next_payment_date := (CURRENT_DATE + interval '30 days')::date;
        END IF;

        -- Update subscription based on payment status
        IF payment_status = 'paid' THEN
          -- If payment is confirmed/paid, activate subscription
          UPDATE user_plan_subscriptions
          SET 
            status = 'active',
            payment_status = 'paid',
            last_payment_date = CASE
              WHEN payment_data->>'paymentDate' IS NOT NULL THEN (payment_data->>'paymentDate')::date
              ELSE CURRENT_DATE
            END,
            next_payment_date = next_payment_date,
            updated_at = NOW()
          WHERE id = subscription_id;
          
          log_message := 'Subscription activated: ' || subscription_id;
          RAISE NOTICE '%', log_message;
        ELSIF payment_status IN ('refunded', 'cancelled') THEN
          -- If payment is refunded or cancelled, update subscription accordingly
          UPDATE user_plan_subscriptions
          SET 
            status = CASE 
              WHEN payment_status = 'refunded' THEN 'refunded'
              WHEN payment_status = 'cancelled' THEN 'cancelled'
              ELSE status
            END,
            payment_status = payment_status,
            updated_at = NOW()
          WHERE id = subscription_id;
          
          log_message := 'Subscription status updated to ' || payment_status || ': ' || subscription_id;
          RAISE NOTICE '%', log_message;
        ELSIF payment_status = 'overdue' THEN
          -- If payment is overdue, mark subscription as overdue
          UPDATE user_plan_subscriptions
          SET 
            payment_status = 'overdue',
            updated_at = NOW()
          WHERE id = subscription_id;
          
          log_message := 'Subscription marked as overdue: ' || subscription_id;
          RAISE NOTICE '%', log_message;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Mark webhook event as processed
  UPDATE public.asaas_webhook_events
  SET 
    processed = true,
    processed_at = NOW(),
    error_message = NULL
  WHERE id = webhook_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Webhook processed successfully',
    'event', event_type,
    'status', COALESCE(payment_data->>'status', subscription_data->>'status', NULL),
    'payment_id', asaas_payment_id,
    'subscription_id', COALESCE(subscription_id::text, NULL),
    'payment_status', payment_status,
    'webhook_event_id', webhook_event_id,
    'log_message', log_message
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error and mark event as failed
  log_message := 'Error processing webhook: ' || SQLERRM || ', SQLSTATE: ' || SQLSTATE;
  RAISE WARNING '%', log_message;
  
  IF webhook_event_id IS NOT NULL THEN
    -- Get current retry count
    SELECT COALESCE(retry_count, 0) INTO retry_count
    FROM public.asaas_webhook_events
    WHERE id = webhook_event_id;
    
    -- Update webhook event with error
    UPDATE public.asaas_webhook_events
    SET 
      processed = false,
      processed_at = NOW(),
      error_message = SQLERRM,
      retry_count = retry_count + 1
    WHERE id = webhook_event_id;
  END IF;

  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'event', event_type,
    'status', COALESCE(payment_data->>'status', subscription_data->>'status', NULL),
    'payment_id', asaas_payment_id,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- Ensure permissions
REVOKE ALL ON FUNCTION public.process_asaas_webhook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO service_role;
