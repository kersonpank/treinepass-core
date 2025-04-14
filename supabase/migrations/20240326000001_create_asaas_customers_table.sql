
-- Create asaas_customers table
CREATE TABLE IF NOT EXISTS public.asaas_customers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    asaas_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    cpf_cnpj text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id),
    UNIQUE(asaas_id)
);

-- Enable RLS
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Usuários autenticados podem ler seus próprios registros" ON public.asaas_customers;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir seus próprios registros" ON public.asaas_customers;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seus próprios registros" ON public.asaas_customers;

-- Create new policies
CREATE POLICY "Usuários autenticados podem ler seus próprios registros"
ON public.asaas_customers
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários autenticados podem inserir seus próprios registros"
ON public.asaas_customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários autenticados podem atualizar seus próprios registros"
ON public.asaas_customers
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.asaas_customers
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at(); 
