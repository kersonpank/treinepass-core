
CREATE OR REPLACE FUNCTION public.process_asaas_webhook(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_data jsonb;
  subscription_id uuid;
  payment_status text;
  payment_record record;
  subscription_record record;
  webhook_event_id uuid;
  asaas_payment_id text;
  event_type text;
  asaas_subscription_id text;
BEGIN
  -- Initial logging
  RAISE NOTICE 'Processing Asaas webhook: %', payload;

  -- Extract payment data and event type
  payment_data := payload->'payment';
  event_type := payload->>'event';
  
  IF payment_data IS NULL AND event_type NOT LIKE 'PAYMENT_%' THEN
    -- Handle non-payment events if needed
    INSERT INTO public.asaas_webhook_events (
      event_type,
      event_data,
      processed,
      processed_at
    ) VALUES (
      event_type,
      payload,
      true,
      NOW()
    ) RETURNING id INTO webhook_event_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Non-payment event logged',
      'event_type', event_type,
      'webhook_event_id', webhook_event_id
    );
  END IF;

  -- If we get here, we're dealing with a payment event
  IF payment_data IS NULL THEN
    RAISE EXCEPTION 'Invalid payload: payment data not found for payment event';
  END IF;

  asaas_payment_id := payment_data->>'id';
  asaas_subscription_id := payment_data->>'subscription';
  
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

  -- Find the payment record in our system
  SELECT * INTO payment_record
  FROM asaas_payments
  WHERE asaas_id = asaas_payment_id;

  IF NOT FOUND THEN
    -- Try to find payment by external reference (subscription ID)
    IF payment_data->>'externalReference' IS NOT NULL THEN
      SELECT * INTO payment_record
      FROM asaas_payments
      WHERE external_reference = payment_data->>'externalReference';
    END IF;
    
    -- If still not found, create a new payment record
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
          WHEN payment_status = 'paid' THEN NOW()
          ELSE NULL
        END,
        payment_data->>'externalReference',
        payment_data->>'invoiceUrl',
        payment_data->>'invoiceUrl'
      ) RETURNING * INTO payment_record;
      
      -- Try to link to subscription if external reference exists
      IF payment_data->>'externalReference' IS NOT NULL THEN
        UPDATE asaas_payments 
        SET subscription_id = (
          SELECT id FROM user_plan_subscriptions 
          WHERE id::text = payment_data->>'externalReference'
          LIMIT 1
        )
        WHERE id = payment_record.id;
        
        -- Reload payment record to get subscription_id
        SELECT * INTO payment_record
        FROM asaas_payments
        WHERE id = payment_record.id;
      END IF;
    END IF;
  END IF;

  -- Update payment status
  UPDATE asaas_payments
  SET 
    status = payment_data->>'status',  -- Keep original Asaas status
    billing_type = payment_data->>'billingType',
    payment_date = CASE 
      WHEN payment_status = 'paid' THEN NOW()
      ELSE payment_date
    END,
    invoice_url = COALESCE(payment_data->>'invoiceUrl', invoice_url),
    payment_link = COALESCE(payment_data->>'invoiceUrl', payment_link),
    updated_at = NOW()
  WHERE id = payment_record.id
  RETURNING subscription_id INTO subscription_id;

  -- If no subscription_id in payment record but we have subscription in webhook
  IF subscription_id IS NULL AND asaas_subscription_id IS NOT NULL THEN
    -- Find subscription by Asaas ID
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
  
  -- Alternatively use external reference to find subscription
  IF subscription_id IS NULL AND payment_data->>'externalReference' IS NOT NULL THEN
    -- Try to find by external reference which should be the subscription ID
    SELECT id INTO subscription_id
    FROM user_plan_subscriptions
    WHERE id::text = payment_data->>'externalReference';
    
    -- If found, update payment record with subscription_id
    IF subscription_id IS NOT NULL THEN
      UPDATE asaas_payments
      SET subscription_id = subscription_id
      WHERE id = payment_record.id;
    END IF;
  END IF;

  -- If payment is confirmed, update the subscription
  IF payment_status = 'paid' AND subscription_id IS NOT NULL THEN
    -- Find the subscription
    SELECT * INTO subscription_record
    FROM user_plan_subscriptions
    WHERE id = subscription_id;

    IF FOUND THEN
      -- Update subscription status
      UPDATE user_plan_subscriptions
      SET 
        status = 'active',
        payment_status = 'paid',
        last_payment_date = NOW(),
        next_payment_date = (NOW() + interval '1 month')::timestamp,
        updated_at = NOW()
      WHERE id = subscription_id;
      
      RAISE NOTICE 'Subscription activated: %', subscription_id;
    END IF;
  -- If payment is refunded or cancelled, update subscription accordingly
  ELSIF payment_status IN ('refunded', 'cancelled') AND subscription_id IS NOT NULL THEN
    SELECT * INTO subscription_record
    FROM user_plan_subscriptions
    WHERE id = subscription_id;
    
    IF FOUND THEN
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
      
      RAISE NOTICE 'Subscription status updated to %: %', payment_status, subscription_id;
    END IF;
  -- If payment is overdue, update subscription accordingly
  ELSIF payment_status = 'overdue' AND subscription_id IS NOT NULL THEN
    UPDATE user_plan_subscriptions
    SET 
      payment_status = 'overdue',
      updated_at = NOW()
    WHERE id = subscription_id;
    
    RAISE NOTICE 'Subscription marked as overdue: %', subscription_id;
  END IF;

  -- Mark webhook event as processed
  UPDATE public.asaas_webhook_events
  SET 
    processed = true,
    processed_at = NOW()
  WHERE id = webhook_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Webhook processed successfully',
    'event', event_type,
    'status', payment_data->>'status',
    'payment_id', asaas_payment_id,
    'subscription_id', COALESCE(subscription_id::text, NULL),
    'payment_status', payment_status,
    'webhook_event_id', webhook_event_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error and mark event as failed
  RAISE NOTICE 'Error processing webhook: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  
  IF webhook_event_id IS NOT NULL THEN
    UPDATE public.asaas_webhook_events
    SET 
      processed = false,
      processed_at = NOW()
    WHERE id = webhook_event_id;
  END IF;

  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'event', event_type,
    'status', COALESCE(payment_data->>'status', NULL),
    'payment_id', asaas_payment_id
  );
END;
$$;

-- Ensure permissions
REVOKE ALL ON FUNCTION public.process_asaas_webhook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO service_role;
