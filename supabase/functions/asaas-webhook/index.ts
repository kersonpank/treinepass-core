import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
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

serve(async (req) => {
  // Permitir preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    // Validar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await req.json();
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    // Validar token do webhook
    const config = await getAsaasConfig();
    const webhookToken = req.headers.get('asaas-access-token') || req.headers.get('access_token');
    
    console.log('Token recebido:', webhookToken);
    console.log('Token esperado:', config.webhook_token);
    
    if (!webhookToken) {
      return new Response(
        JSON.stringify({ 
          error: 'Token do webhook não encontrado',
          headers: Object.fromEntries(req.headers.entries())
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (webhookToken !== config.webhook_token) {
      return new Response(
        JSON.stringify({ 
          error: 'Token do webhook inválido',
          received: webhookToken,
          expected: config.webhook_token
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Processar o webhook usando a função do banco
    const { data: result, error: processError } = await supabase
      .rpc('process_asaas_webhook', {
        payload: body
      });

    if (processError) {
      console.error('Erro ao processar webhook:', processError);
      throw processError;
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erro no webhook do Asaas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function mapAsaasStatus(asaasStatus: string): string {
  switch (asaasStatus) {
    case 'CONFIRMED':
    case 'RECEIVED':
    case 'RECEIVED_IN_CASH':
      return 'paid';
    case 'PENDING':
    case 'AWAITING_RISK_ANALYSIS':
      return 'pending';
    case 'OVERDUE':
      return 'overdue';
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
      return 'refunded';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'pending';
  }
}
