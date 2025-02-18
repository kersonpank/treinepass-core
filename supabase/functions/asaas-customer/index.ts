
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCustomerPayload {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { method } = req.url.split('?')[0].split('/').pop() ?? ''
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Obter token de autenticação
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verificar usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Configuração ASAAS
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    const ASAAS_API_URL = 'https://www.asaas.com/api/v3'

    switch (method) {
      case 'create': {
        const payload: CreateCustomerPayload = await req.json()
        
        console.log('Creating ASAAS customer:', payload)

        // Criar cliente no ASAAS
        const asaasResponse = await fetch(`${ASAAS_API_URL}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY!
          },
          body: JSON.stringify(payload)
        })

        if (!asaasResponse.ok) {
          const error = await asaasResponse.json()
          console.error('ASAAS API error:', error)
          throw new Error(`ASAAS API error: ${error.errors?.[0]?.description || 'Unknown error'}`)
        }

        const asaasCustomer = await asaasResponse.json()
        console.log('ASAAS customer created:', asaasCustomer)

        // Salvar cliente no banco
        const { error: dbError } = await supabase
          .from('asaas_customers')
          .insert({
            user_id: user.id,
            asaas_id: asaasCustomer.id,
            name: asaasCustomer.name,
            email: asaasCustomer.email,
            cpf_cnpj: asaasCustomer.cpfCnpj,
          })

        if (dbError) {
          console.error('Database error:', dbError)
          throw new Error('Failed to save customer data')
        }

        return new Response(
          JSON.stringify({ success: true, customer: asaasCustomer }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get': {
        // Buscar cliente existente
        const { data: customer, error: customerError } = await supabase
          .from('asaas_customers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (customerError && customerError.code !== 'PGRST116') {
          console.error('Database error:', customerError)
          throw new Error('Failed to fetch customer data')
        }

        return new Response(
          JSON.stringify({ success: true, customer }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Method not allowed')
    }
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
