
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get request body
    const { asaasSubscriptionId } = await req.json();
    
    if (!asaasSubscriptionId) {
      return new Response(
        JSON.stringify({ error: "asaasSubscriptionId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Cancelando assinatura Asaas: ${asaasSubscriptionId}`);

    // Get asaas settings
    const { data: asaasSettings, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "asaas_settings")
      .single();

    if (settingsError) {
      console.error("Erro ao buscar configurações do Asaas:", settingsError);
      throw new Error("Erro ao buscar configurações do Asaas");
    }

    const settings = asaasSettings.value;
    const apiKey = settings.environment === "production" 
      ? settings.production_api_key 
      : settings.sandbox_api_key;
    
    const apiUrl = settings.environment === "production" 
      ? "https://api.asaas.com/v3" 
      : "https://api-sandbox.asaas.com/v3";

    // Cancel subscription in Asaas
    const response = await fetch(`${apiUrl}/subscriptions/${asaasSubscriptionId}`, {
      method: "DELETE",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "access_token": apiKey
      }
    });

    const responseData = await response.json();
    console.log("Resposta do Asaas:", responseData);

    if (!response.ok) {
      throw new Error(`Falha ao cancelar assinatura: ${JSON.stringify(responseData)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Assinatura cancelada com sucesso no Asaas",
        data: responseData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erro ao cancelar assinatura: ${error.message}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
