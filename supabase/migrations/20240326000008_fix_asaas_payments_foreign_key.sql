-- Drop existing foreign key
ALTER TABLE public.asaas_payments
DROP CONSTRAINT IF EXISTS asaas_payments_subscription_id_fkey;

-- Add new foreign key
ALTER TABLE public.asaas_payments
ADD CONSTRAINT asaas_payments_subscription_id_fkey
FOREIGN KEY (subscription_id)
REFERENCES public.user_plan_subscriptions(id);