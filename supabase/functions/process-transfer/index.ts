
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Função de processamento de repasse iniciada");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transferId } = await req.json();
    console.log(`Processando repasse ID: ${transferId}`);

    // Buscar dados do repasse
    const { data: transfer, error: transferError } = await supabase
      .from('asaas_transfers')
      .select('*')
      .eq('id', transferId)
      .single();

    if (transferError) throw transferError;
    if (!transfer) throw new Error('Repasse não encontrado');

    // Chamar API do ASAAS para realizar a transferência
    const asaasResponse = await fetch(`https://api.asaas.com/v3/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': Deno.env.get('ASAAS_API_KEY') ?? '',
      },
      body: JSON.stringify({
        value: transfer.amount,
        bankAccount: {
          // Aqui você precisará adicionar os dados bancários da academia
          // bank: { code: "999" },
          // accountName: "Nome do Titular",
          // ownerName: "Nome do Titular",
          // ownerBirthDate: "1985-01-01",
          // cpfCnpj: "12345678901",
          // accountNumber: "123456",
          // accountDigit: "1",
          // agencyNumber: "1234",
          // agencyDigit: "1",
          // bankAccountType: "CHECKING"
        }
      }),
    });

    if (!asaasResponse.ok) {
      throw new Error('Erro ao processar repasse no ASAAS');
    }

    // Atualizar status do repasse
    const { error: updateError } = await supabase
      .from('asaas_transfers')
      .update({ 
        status: 'COMPLETED',
        transfer_date: new Date().toISOString(),
        asaas_id: (await asaasResponse.json()).id
      })
      .eq('id', transferId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
