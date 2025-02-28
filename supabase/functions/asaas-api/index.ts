import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function getAsaasConfig() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'asaas_settings')
    .single();

  if (error) throw error;
  return data.value;
}

async function asaasRequest(endpoint: string, method = 'GET', data?: any) {
  const config = await getAsaasConfig();
  const ASAAS_API_KEY = config.environment === 'production' ? config.production_api_key : config.sandbox_api_key;
  const ASAAS_API_URL = config.environment === 'production' 
    ? 'https://api.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    method,
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.description || 'Erro na requisição ao Asaas');
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'createCustomer':
        const customer = await asaasRequest('/customers', 'POST', {
          name: data.name,
          email: data.email,
          cpfCnpj: data.cpfCnpj,
          ...data
        });
        return new Response(JSON.stringify(customer), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'createTransfer':
        const transfer = await asaasRequest('/transfers', 'POST', {
          value: data.value,
          bankAccount: data.bankAccount
        });
        return new Response(JSON.stringify(transfer), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'createPayment':
        const paymentData = {
          customer: data.customerId,
          billingType: data.billingType,
          value: data.value,
          dueDate: data.dueDate,
          description: data.description,
          externalReference: data.externalReference,
          ...data
        };

        // Configurações específicas para PIX
        if (data.billingType === 'PIX') {
          paymentData.postalService = false;
          paymentData.interest = {
            value: 2
          };
          paymentData.fine = {
            value: 1
          };
        }

        const payment = await asaasRequest('/payments', 'POST', paymentData);
        
        // Se for PIX, buscar o QR Code
        if (data.billingType === 'PIX' && payment.id) {
          const pixInfo = await asaasRequest(`/payments/${payment.id}/pixQrCode`, 'GET');
          payment.pixQrCode = pixInfo.encodedImage;
          payment.pixKey = pixInfo.payload;
        }

        return new Response(JSON.stringify(payment), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Ação não suportada');
    }
  } catch (error) {
    console.error('Erro na função asaas-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
