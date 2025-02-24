
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ASAAS_API_URL = "https://sandbox.asaas.com/api/v3";

interface CreateCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

interface CreateSubscriptionPayload {
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    const apiKey = Deno.env.get('ASAAS_API_KEY')

    if (!apiKey) {
      throw new Error('ASAAS_API_KEY não configurada')
    }

    const headers = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      ...corsHeaders
    }

    switch (action) {
      case 'createCustomer': {
        const { name, email, cpfCnpj, phone } = payload as CreateCustomerPayload
        
        const response = await fetch(`${ASAAS_API_URL}/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            email,
            cpfCnpj,
            phone,
            notificationDisabled: false
          })
        })

        const data = await response.json()
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'createSubscription': {
        const { 
          customer,
          billingType,
          value,
          nextDueDate,
          cycle,
          description
        } = payload as CreateSubscriptionPayload

        const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customer,
            billingType,
            value,
            nextDueDate,
            cycle,
            description,
            maxPayments: 0
          })
        })

        const data = await response.json()
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'createTransfer': {
        const response = await fetch(`${ASAAS_API_URL}/transfers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        const data = await response.json()
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error('Ação não suportada')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
