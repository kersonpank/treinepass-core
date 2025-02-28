
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
  
  -- Register the webhook event
  INSERT INTO public.asaas_webhook_events (
    payment_id,
    event_type,
    status,
    payload,
    processed,
    processed_at
  ) VALUES (
    asaas_payment_id,
    event_type,
    payment_data->>'status',
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
    -- Log the issue but don't fail the webhook
    RAISE NOTICE 'Payment not found in database: %', asaas_payment_id;
    
    UPDATE public.asaas_webhook_events
    SET 
      processed = true,
      processed_at = NOW()
    WHERE id = webhook_event_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Payment not found: ' || asaas_payment_id,
      'webhook_event_id', webhook_event_id
    );
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
    updated_at = NOW()
  WHERE id = payment_record.id;

  -- If payment is confirmed, update the subscription
  IF payment_status = 'paid' THEN
    -- Find the subscription
    SELECT * INTO subscription_record
    FROM user_plan_subscriptions
    WHERE id = payment_record.subscription_id;

    IF NOT FOUND THEN
      RAISE NOTICE 'Subscription not found: %', payment_record.subscription_id;
    ELSE
      -- Update subscription status
      UPDATE user_plan_subscriptions
      SET 
        status = 'active',
        payment_status = 'paid',
        last_payment_date = NOW(),
        next_payment_date = (NOW() + interval '1 month')::timestamp,
        updated_at = NOW()
      WHERE id = subscription_record.id;
      
      RAISE NOTICE 'Subscription activated: %', subscription_record.id;
    END IF;
  -- If payment is refunded or cancelled, update subscription accordingly
  ELSIF payment_status IN ('refunded', 'cancelled') THEN
    SELECT * INTO subscription_record
    FROM user_plan_subscriptions
    WHERE id = payment_record.subscription_id;
    
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
      WHERE id = subscription_record.id;
      
      RAISE NOTICE 'Subscription status updated to %: %', payment_status, subscription_record.id;
    END IF;
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
    'payment_id', payment_record.id,
    'subscription_id', COALESCE(subscription_record.id, NULL),
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
    'webhook_event_id', webhook_event_id
  );
END;
$$;

-- Ensure permissions
REVOKE ALL ON FUNCTION public.process_asaas_webhook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_asaas_webhook(jsonb) TO service_role;
