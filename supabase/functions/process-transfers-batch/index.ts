
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const currentDate = new Date();
    const referenceMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    // Buscar academias com repasses pendentes
    const { data: checkIns, error: checkInsError } = await supabase
      .from("gym_check_ins")
      .select(`
        id,
        academia_id,
        valor_repasse,
        academias (
          nome,
          academia_dados_bancarios (*)
        )
      `)
      .gte("check_in_time", referenceMonth.toISOString())
      .lt("check_in_time", new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() + 1, 1).toISOString())
      .is("transfer_id", null);

    if (checkInsError) {
      throw checkInsError;
    }

    // Agrupar repasses por academia
    const repassesPorAcademia = checkIns.reduce((acc, checkIn) => {
      const academiaId = checkIn.academia_id;
      if (!acc[academiaId]) {
        acc[academiaId] = {
          academia: checkIn.academias,
          total: 0,
          checkIns: []
        };
      }
      acc[academiaId].total += Number(checkIn.valor_repasse);
      acc[academiaId].checkIns.push(checkIn.id);
      return acc;
    }, {});

    // Criar lote de transferências
    const { data: batch, error: batchError } = await supabase
      .from("asaas_transfer_batch")
      .insert({
        reference_month: referenceMonth.toISOString(),
        total_amount: Object.values(repassesPorAcademia).reduce((acc: number, curr: any) => acc + curr.total, 0),
        total_transfers: Object.keys(repassesPorAcademia).length
      })
      .select()
      .single();

    if (batchError) {
      throw batchError;
    }

    // Processar transferências
    for (const [academiaId, data] of Object.entries(repassesPorAcademia)) {
      const academia: any = data.academia;
      const total: number = data.total;
      const checkInIds: string[] = data.checkIns;

      if (!academia.academia_dados_bancarios?.[0]) {
        console.log(`Academia ${academia.nome} não possui dados bancários cadastrados`);
        continue;
      }

      // Criar transferência no Asaas
      const dadosBancarios = academia.academia_dados_bancarios[0];
      const transferData = dadosBancarios.metodo_preferencial === "PIX" 
        ? {
            value: total,
            pixAddressKey: dadosBancarios.chave_pix,
            pixAddressKeyType: dadosBancarios.tipo_chave_pix,
          }
        : {
            value: total,
            bankAccount: {
              bank: {
                code: dadosBancarios.banco_codigo,
              },
              accountName: dadosBancarios.titular_nome,
              ownerName: dadosBancarios.titular_nome,
              cpfCnpj: dadosBancarios.titular_cpf_cnpj,
              type: dadosBancarios.tipo_conta,
              agency: dadosBancarios.agencia,
              agencyDigit: dadosBancarios.agencia_digito,
              account: dadosBancarios.conta,
              accountDigit: dadosBancarios.conta_digito,
            },
          };

      const asaasResponse = await fetch(
        "https://api.asaas.com/v3/transfers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": Deno.env.get("ASAAS_API_KEY") || "",
          },
          body: JSON.stringify(transferData),
        }
      );

      if (!asaasResponse.ok) {
        console.error(`Erro ao criar transferência para academia ${academia.nome}:`, await asaasResponse.text());
        continue;
      }

      const asaasTransfer = await asaasResponse.json();

      // Registrar transferência no banco
      const { data: transfer, error: transferError } = await supabase
        .from("asaas_transfers")
        .insert({
          academia_id: academiaId,
          amount: total,
          status: "PENDING",
          asaas_id: asaasTransfer.id,
          reference_month: referenceMonth.toISOString(),
          batch_id: batch.id
        })
        .select()
        .single();

      if (transferError) {
        console.error(`Erro ao registrar transferência para academia ${academia.nome}:`, transferError);
        continue;
      }

      // Atualizar check-ins com o ID da transferência
      const { error: updateError } = await supabase
        .from("gym_check_ins")
        .update({ transfer_id: transfer.id })
        .in("id", checkInIds);

      if (updateError) {
        console.error(`Erro ao atualizar check-ins da academia ${academia.nome}:`, updateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, batch_id: batch.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing transfers batch:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
