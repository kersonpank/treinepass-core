
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateSubscriptionRequest {
  customerId: string;
  planId: string;
  billingType: string;
}

interface CreateTransferRequest {
  academiaId: string;
  cycleId: string;
  amount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (!action) {
      throw new Error('Missing action parameter');
    }

    switch (action) {
      case 'createSubscription': {
        const { customerId, planId, billingType }: CreateSubscriptionRequest = await req.json();

        // Get plan details
        const { data: plan, error: planError } = await supabase
          .from('benefit_plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (planError || !plan) {
          throw new Error('Plan not found');
        }

        // Get customer details
        const { data: customer, error: customerError } = await supabase
          .from('asaas_customers')
          .select('asaas_id, email')
          .eq('id', customerId)
          .single();

        if (customerError || !customer) {
          throw new Error('Customer not found');
        }

        // Create subscription in Asaas
        const asaasResponse = await fetch('https://api.asaas.com/v3/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
          },
          body: JSON.stringify({
            customer: customer.asaas_id,
            billingType: billingType,
            value: plan.monthly_cost,
            nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            cycle: 'MONTHLY',
            description: `Assinatura do plano ${plan.name}`,
            maxPayments: plan.validity_period ? 
              Math.ceil(plan.validity_period.days / 30) : undefined,
          }),
        });

        if (!asaasResponse.ok) {
          throw new Error('Failed to create subscription in Asaas');
        }

        const asaasData = await asaasResponse.json();

        // Create subscription record
        const { error: subscriptionError } = await supabase
          .from('user_plan_subscriptions')
          .insert({
            user_id: customerId,
            plan_id: planId,
            status: 'pending',
            start_date: new Date().toISOString(),
            end_date: plan.validity_period ? 
              new Date(Date.now() + plan.validity_period.days * 24 * 60 * 60 * 1000).toISOString() : 
              null,
          });

        if (subscriptionError) {
          throw new Error('Failed to create subscription record');
        }

        // Create payment record
        const { error: paymentError } = await supabase
          .from('asaas_payments')
          .insert({
            customer_id: customerId,
            subscription_id: asaasData.id,
            amount: plan.monthly_cost,
            billing_type: billingType,
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'PENDING',
            subscription_type: plan.plan_type,
          });

        if (paymentError) {
          throw new Error('Failed to create payment record');
        }

        return new Response(JSON.stringify({
          success: true,
          data: asaasData,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      case 'createTransfer': {
        const { academiaId, cycleId, amount }: CreateTransferRequest = await req.json();

        // Get academia bank details
        const { data: bankDetails, error: bankError } = await supabase
          .from('academia_dados_bancarios')
          .select('*')
          .eq('academia_id', academiaId)
          .single();

        if (bankError || !bankDetails) {
          throw new Error('Bank details not found');
        }

        // Create transfer in Asaas
        const asaasResponse = await fetch('https://api.asaas.com/v3/transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
          },
          body: JSON.stringify({
            value: amount,
            bankAccount: {
              bank: {
                code: bankDetails.banco_codigo,
              },
              accountName: bankDetails.titular_nome,
              ownerName: bankDetails.titular_nome,
              ownerBirthDate: null,
              cpfCnpj: bankDetails.titular_cpf_cnpj,
              type: bankDetails.tipo_conta,
              agencyNumber: bankDetails.agencia,
              accountNumber: bankDetails.conta,
              accountDigit: bankDetails.conta_digito,
            },
          }),
        });

        if (!asaasResponse.ok) {
          throw new Error('Failed to create transfer in Asaas');
        }

        const asaasData = await asaasResponse.json();

        // Update transfer record
        const { error: transferError } = await supabase
          .from('asaas_transfers')
          .insert({
            academia_id: academiaId,
            amount: amount,
            asaas_id: asaasData.id,
            status: 'PENDING',
            reference_month: new Date().toISOString().split('T')[0],
          });

        if (transferError) {
          throw new Error('Failed to create transfer record');
        }

        // Update payout cycle
        const { error: cycleError } = await supabase
          .from('gym_payout_cycles')
          .update({
            asaas_transfer_id: asaasData.id,
            status: 'processing',
          })
          .eq('id', cycleId);

        if (cycleError) {
          throw new Error('Failed to update payout cycle');
        }

        return new Response(JSON.stringify({
          success: true,
          data: asaasData,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

