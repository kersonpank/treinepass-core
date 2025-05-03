
-- Create table for Mercado Pago webhook events
CREATE TABLE mercadopago_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'received',
  error_message TEXT,
  signature_valid BOOLEAN
);

-- Index for faster lookups
CREATE INDEX idx_mercadopago_webhook_events_event_id ON mercadopago_webhook_events(event_id);
CREATE INDEX idx_mercadopago_webhook_events_event_type ON mercadopago_webhook_events(event_type);
CREATE INDEX idx_mercadopago_webhook_events_status ON mercadopago_webhook_events(status);
