
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_API_URL = 'https://api.asaas.com/v3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, data } = await req.json()
    console.log(`Processing ${action} with data:`, data)

    switch (action) {
      case 'createSubscription': {
        const { userId, planId, paymentMethod } = data
        
        // Get user data
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (userError) throw userError

        // Get plan data
        const { data: planData, error: planError } = await supabase
          .from('benefit_plans')
          .select('*')
          .eq('id', planId)
          .single()
        
        if (planError) throw planError

        // Create or get Asaas customer
        const { data: customerData, error: customerError } = await supabase
          .from('asaas_customers')
          .select('*')
          .eq('user_id', userId)
          .single()

        let asaasCustomerId
        if (!customerData) {
          const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
            method: 'POST',
            headers: {
              'access_token': ASAAS_API_KEY!,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: userData.full_name,
              email: userData.email,
              cpfCnpj: userData.cpf,
              phone: userData.phone_number
            })
          })

          const customer = await customerResponse.json()
          if (!customerResponse.ok) throw new Error(customer.errors[0].description)

          const { error: insertError } = await supabase
            .from('asaas_customers')
            .insert({
              user_id: userId,
              asaas_id: customer.id,
              name: userData.full_name,
              email: userData.email,
              cpf_cnpj: userData.cpf
            })

          if (insertError) throw insertError
          asaasCustomerId = customer.id
        } else {
          asaasCustomerId = customerData.asaas_id
        }

        // Create Asaas subscription
        const subscriptionResponse = await fetch(`${ASAAS_API_URL}/subscriptions`, {
          method: 'POST',
          headers: {
            'access_token': ASAAS_API_KEY!,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: paymentMethod,
            value: planData.monthly_cost,
            nextDueDate: new Date().toISOString().split('T')[0],
            cycle: planData.period_type.toUpperCase(),
            description: `Subscription to ${planData.name}`,
            maxPayments: planData.minimum_contract_months
          })
        })

        const subscription = await subscriptionResponse.json()
        if (!subscriptionResponse.ok) throw new Error(subscription.errors[0].description)

        // Create subscription record
        const { data: subscriptionRecord, error: subscriptionError } = await supabase
          .from('user_plan_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'pending',
            payment_status: 'pending',
            asaas_subscription_id: subscription.id,
            payment_method: paymentMethod,
            start_date: new Date().toISOString(),
            total_value: planData.monthly_cost * (planData.minimum_contract_months || 1),
            installments: planData.minimum_contract_months
          })
          .select()
          .single()

        if (subscriptionError) throw subscriptionError

        // Register initial payment in financial transactions
        const { error: transactionError } = await supabase
          .from('financial_transactions')
          .insert({
            transaction_type: 'payment',
            entity_type: 'user',
            entity_id: userId,
            amount: planData.monthly_cost,
            status: 'pending',
            description: `Initial payment for subscription to ${planData.name}`
          })

        if (transactionError) throw transactionError

        return new Response(JSON.stringify(subscriptionRecord), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }

      case 'processTransfers': {
        // Get academias with pending transfers
        const { data: cycles, error: cyclesError } = await supabase
          .from('gym_payout_cycles')
          .select(`
            id,
            academia_id,
            total_amount,
            academias (
              nome,
              academia_dados_bancarios (*)
            )
          `)
          .eq('status', 'active')
          .gt('total_amount', 0)

        if (cyclesError) throw cyclesError

        const transfers = []
        for (const cycle of cycles) {
          if (!cycle.academias.academia_dados_bancarios?.[0]) continue

          const bankData = cycle.academias.academia_dados_bancarios[0]
          
          // Create transfer in Asaas
          const transferResponse = await fetch(`${ASAAS_API_URL}/transfers`, {
            method: 'POST',
            headers: {
              'access_token': ASAAS_API_KEY!,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              value: cycle.total_amount,
              bankAccount: {
                bank: {
                  code: bankData.banco_codigo
                },
                accountName: bankData.titular_nome,
                ownerName: bankData.titular_nome,
                ownerBirthDate: "1985-01-01", // Required by Asaas but not used
                cpfCnpj: bankData.titular_cpf_cnpj,
                agency: bankData.agencia,
                agencyDigit: bankData.agencia_digito,
                account: bankData.conta,
                accountDigit: bankData.conta_digito,
                bankAccountType: bankData.tipo_conta?.toUpperCase() || "CHECKING"
              }
            })
          })

          const transfer = await transferResponse.json()
          if (!transferResponse.ok) {
            console.error(`Transfer error for academia ${cycle.academia_id}:`, transfer)
            continue
          }

          // Register transfer
          const { data: transferRecord, error: transferError } = await supabase
            .from('asaas_transfers')
            .insert({
              academia_id: cycle.academia_id,
              amount: cycle.total_amount,
              asaas_id: transfer.id,
              status: 'PENDING',
              reference_month: new Date().toISOString().split('T')[0]
            })
            .select()
            .single()

          if (transferError) throw transferError

          // Update cycle
          const { error: cycleError } = await supabase
            .from('gym_payout_cycles')
            .update({ status: 'completed' })
            .eq('id', cycle.id)

          if (cycleError) throw cycleError

          transfers.push(transferRecord)
        }

        return new Response(JSON.stringify({ transfers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
