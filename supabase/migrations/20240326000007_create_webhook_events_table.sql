
-- Create webhook events table
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    processed boolean DEFAULT false,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Apenas administradores podem ler eventos do webhook"
ON public.asaas_webhook_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.asaas_webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.asaas_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.asaas_webhook_events(processed);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.asaas_webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
