
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || 'seu-token-secreto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar token de acesso do Asaas
    const asaasToken = req.headers.get('asaas-access-token');
    if (asaasToken !== WEBHOOK_TOKEN) {
      console.error('Token inválido');
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid webhook token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Processar o payload
    const payload = await req.json();
    console.log('Webhook recebido:', JSON.stringify(payload));

    // Validar estrutura do payload
    const eventType = payload.event;
    if (!eventType) {
      console.error('Estrutura de payload inválida: event não encontrado');
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid payload structure' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Para eventos de pagamento, verificar a estrutura do objeto payment
    if (eventType.startsWith('PAYMENT_') && !payload.payment) {
      console.error('Estrutura de payload inválida: payment não encontrado para evento de pagamento');
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid payment payload structure' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Chamar a função de processamento do webhook
    const { data, error } = await supabase
      .rpc('process_asaas_webhook', { payload })
      .single();

    if (error) {
      console.error('Erro ao processar webhook:', error);
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Webhook processado com sucesso:', data);
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar webhook:', error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
