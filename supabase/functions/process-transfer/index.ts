
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TransferRequest {
  academiaId: string;
  amount: number;
  referenceMonth: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { academiaId, amount, referenceMonth } = await req.json() as TransferRequest;

    // Buscar dados bancários da academia
    const { data: dadosBancarios } = await supabase
      .from("academia_dados_bancarios")
      .select("*")
      .eq("academia_id", academiaId)
      .single();

    if (!dadosBancarios) {
      throw new Error("Dados bancários não encontrados");
    }

    // Criar transferência no Asaas
    let transferData;
    if (dadosBancarios.metodo_preferencial === "PIX") {
      transferData = {
        value: amount,
        pixAddressKey: dadosBancarios.chave_pix,
        pixAddressKeyType: dadosBancarios.tipo_chave_pix,
      };
    } else {
      transferData = {
        value: amount,
        bankAccount: {
          bank: {
            code: dadosBancarios.banco_codigo,
          },
          accountName: dadosBancarios.titular_nome,
          ownerName: dadosBancarios.titular_nome,
          ownerBirthDate: null, // Opcional
          cpfCnpj: dadosBancarios.titular_cpf_cnpj,
          type: dadosBancarios.tipo_conta,
          agency: dadosBancarios.agencia,
          agencyDigit: dadosBancarios.agencia_digito,
          account: dadosBancarios.conta,
          accountDigit: dadosBancarios.conta_digito,
        },
      };
    }

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
      throw new Error("Erro ao criar transferência no Asaas");
    }

    const asaasTransfer = await asaasResponse.json();

    // Registrar transferência no banco
    const { data: transfer, error: transferError } = await supabase
      .from("asaas_transfers")
      .insert({
        academia_id: academiaId,
        amount,
        status: "PENDING",
        asaas_id: asaasTransfer.id,
        reference_month: referenceMonth,
      })
      .select()
      .single();

    if (transferError) {
      throw transferError;
    }

    return new Response(
      JSON.stringify(transfer),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
