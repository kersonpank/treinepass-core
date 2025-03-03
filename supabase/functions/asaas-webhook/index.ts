
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Inicializar o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definir os headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para verificar o token do webhook
async function verifyWebhookToken(token: string): Promise<boolean> {
  try {
    // Buscar a configuração do Asaas
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "asaas_settings")
      .single();

    if (error || !data) {
      console.error("Erro ao buscar configurações Asaas:", error);
      return false;
    }

    // Verificar se o token corresponde
    const webhookToken = data.value?.webhook_token;
    
    if (!webhookToken) {
      console.error("Token de webhook não configurado");
      return false;
    }

    return token === webhookToken;
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    return false;
  }
}

// Função principal para processar os webhooks
serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verificar method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    // Obter o payload do webhook
    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    // Verificar se o payload tem a estrutura correta
    if (!payload.event) {
      return new Response(
        JSON.stringify({ 
          error: "Payload inválido", 
          message: "Evento não especificado"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Processar o webhook utilizando a função RPC
    const { data, error } = await supabase.rpc("process_asaas_webhook", {
      payload,
    });

    if (error) {
      console.error("Erro ao processar webhook:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          event: payload.event,
          status: payload.payment?.status || payload.subscription?.status,
          message: error.message,
          payment_id: payload.payment?.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Webhook processed successfully:", data);

    return new Response(
      JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("Erro no processamento do webhook:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: err.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
