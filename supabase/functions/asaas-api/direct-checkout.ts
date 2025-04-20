import { createClient } from '@supabase/supabase-js';
import { createDirectCheckout } from './checkout-direct';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handler = async (req: Request): Promise<Response> => {
  // Lidar com preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ASAAS_API_KEY');
    const baseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey) {
      throw new Error('ASAAS_API_KEY env var not set');
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var not set');
    }

    console.log(`Using Asaas API: ${baseUrl}`);
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter dados da requisição
    const requestData = await req.json();
    console.log("Dados recebidos:", JSON.stringify(requestData, null, 2));

    // Adicionar supabase aos dados para uso na função de checkout
    requestData.supabase = supabase;

    // Criar checkout direto
    const result = await createDirectCheckout(requestData, apiKey, baseUrl);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
};
