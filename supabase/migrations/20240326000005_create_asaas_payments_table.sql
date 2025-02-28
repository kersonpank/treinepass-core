-- Create asaas_payments table
CREATE TABLE IF NOT EXISTS public.asaas_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    asaas_id text NOT NULL,
    customer_id uuid NOT NULL REFERENCES asaas_customers(id),
    subscription_id uuid NOT NULL REFERENCES user_plan_subscriptions(id),
    amount numeric(10,2) NOT NULL,
    billing_type text NOT NULL,
    status text NOT NULL,
    due_date date NOT NULL,
    payment_link text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_billing_type CHECK (billing_type IN ('BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED')),
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'RECEIVED_IN_CASH', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL', 'DUNNING_REQUESTED', 'DUNNING_RECEIVED', 'AWAITING_RISK_ANALYSIS'))
);

-- Enable RLS
ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Usuários autenticados podem ler seus próprios pagamentos"
ON public.asaas_payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.asaas_customers ac
        WHERE ac.id = customer_id
        AND ac.user_id = auth.uid()
    )
);

CREATE POLICY "Usuários autenticados podem inserir seus próprios pagamentos"
ON public.asaas_payments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.asaas_customers ac
        WHERE ac.id = customer_id
        AND ac.user_id = auth.uid()
    )
);

CREATE POLICY "Usuários autenticados podem atualizar seus próprios pagamentos"
ON public.asaas_payments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.asaas_customers ac
        WHERE ac.id = customer_id
        AND ac.user_id = auth.uid()
    )
);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.asaas_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 