import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AsaasResponse {
  success: boolean;
  payment?: any;
  pix?: any;
  message?: string;
  error?: string;
  id?: string;
}

const getAsaasApiKey = async (supabase: any) => {
  try {
    // Get Asaas settings from the database
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'asaas_settings')
      .single();
    
    if (error) throw error;
    
    const asaasSettings = data.value;
    const environment = asaasSettings.environment || 'sandbox';
    const apiKey = environment === 'production' 
      ? asaasSettings.production_api_key 
      : asaasSettings.sandbox_api_key;
    
    if (!apiKey) {
      throw new Error(`API key not configured for ${environment} environment`);
    }
    
    return { 
      apiKey,
      environment,
      baseUrl: environment === 'production' 
        ? 'https://api.asaas.com/v3' 
        : 'https://api-sandbox.asaas.com/v3'
    };
  } catch (error) {
    console.error('Error getting Asaas API key:', error);
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { action, data } = await req.json();
    console.log(`Processing ${action} with data:`, data);

    // Get Asaas API configuration
    const { apiKey, baseUrl } = await getAsaasApiKey(supabase);
    console.log(`Using Asaas API: ${baseUrl}`);

    let response: AsaasResponse = {
      success: false
    };

    switch (action) {
      case 'createCustomer': {
        console.log(`Creating customer with data:`, JSON.stringify(data, null, 2));
        
        // Garantir que os dados sejam strings e não sejam vazios após trimming
        const name = String(data.name || '').trim() || 'Cliente Padrão';
        const email = String(data.email || '').trim() || 'cliente@exemplo.com';
        const cpfCnpj = String(data.cpfCnpj || '').replace(/[^0-9]/g, '') || '12345678909';
        
        console.log('Dados formatados para Asaas após validação:', {
          name,
          email,
          cpfCnpj
        });

        // Verificar se o cliente já existe no Asaas pelo CPF/CNPJ
        try {
          console.log(`Verificando se cliente com CPF/CNPJ ${cpfCnpj} já existe no Asaas`);
          const checkResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpj}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            }
          });

          const checkData = await checkResponse.json();
          console.log(`Resposta da verificação de cliente existente:`, JSON.stringify(checkData, null, 2));

          // Se encontrou cliente existente, retornar o ID
          if (checkResponse.ok && checkData.data && checkData.data.length > 0) {
            console.log(`Cliente existente encontrado com ID: ${checkData.data[0].id}`);
            response = {
              success: true,
              id: checkData.data[0].id
            };
            break;
          }
        } catch (error) {
          // Apenas logar o erro, não interromper o fluxo
          console.error(`Erro ao verificar cliente existente:`, error);
        }

        // Preparar dados formatados para o Asaas
        const customerData = {
          name: name,
          email: email,
          cpfCnpj: cpfCnpj
        };

        console.log(`Dados formatados para Asaas:`, JSON.stringify(customerData, null, 2));

        // Make API request to Asaas
        try {
          const asaasResponse = await fetch(`${baseUrl}/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            },
            body: JSON.stringify(customerData)
          });

          // Parse response
          const responseData = await asaasResponse.json();
          console.log(`Asaas customer response:`, JSON.stringify(responseData, null, 2));

          if (!asaasResponse.ok) {
            console.error(`Asaas API error:`, JSON.stringify(responseData, null, 2));
            throw new Error(`Asaas API error: ${responseData.errors?.[0]?.description || JSON.stringify(responseData.errors) || 'Unknown error'}`);
          }

          response = {
            success: true,
            id: responseData.id
          };
        } catch (error: any) {
          console.error(`Erro ao criar cliente no Asaas:`, error);
          throw new Error(`Erro ao criar cliente no Asaas: ${error.message || 'Erro desconhecido'}`);
        }
        break;
      }

      case 'createPayment': {
        console.log(`Creating payment with data:`, data);
        
        // Validate required fields
        if (!data.customer || !data.value) {
          throw new Error('Payment data incomplete. Customer and value are required.');
        }

        // Set default billing type if not provided
        if (!data.billingType) {
          data.billingType = 'UNDEFINED';
        }

        // Determinar se vamos criar um pagamento normal ou um link de pagamento
        let endpoint = `${baseUrl}/payments`;
        let paymentData;

        // Criar um link de pagamento para maior flexibilidade
        if (data.createPaymentLink === true) {
          console.log('Creating payment link instead of direct payment');
          endpoint = `${baseUrl}/paymentLinks`;
          
          // Preparar dados para link de pagamento
          const paymentLinkData = {
            name: data.description || 'Pagamento TreinePass',
            description: data.description,
            value: data.value,
            billingType: data.billingType,
            chargeType: 'DETACHED', // Pagamento avulso
            dueDateLimitDays: 7,     // 7 dias para pagar
            externalReference: data.externalReference
          };
          
          // Make API request to Asaas
          const asaasResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            },
            body: JSON.stringify(paymentLinkData)
          });

          // Parse response
          paymentData = await asaasResponse.json();
          console.log(`Asaas payment link response:`, paymentData);

          if (!asaasResponse.ok) {
            throw new Error(`Asaas API error: ${paymentData.errors?.[0]?.description || 'Unknown error'}`);
          }

          // Adaptar resposta para o formato esperado pela aplicação
          response = {
            success: true,
            payment: {
              id: paymentData.id,
              value: paymentData.value,
              status: 'PENDING',
              dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
              invoiceUrl: paymentData.url,
              billingType: paymentData.billingType
            }
          };
        } else {
          // Criar pagamento normal (original)
          const asaasResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            },
            body: JSON.stringify(data)
          });

          // Parse response
          paymentData = await asaasResponse.json();
          console.log(`Asaas payment response:`, paymentData);

          if (!asaasResponse.ok) {
            throw new Error(`Asaas API error: ${paymentData.errors?.[0]?.description || 'Unknown error'}`);
          }

          response = {
            success: true,
            payment: paymentData
          };

          // If it's a PIX payment, get the QR code
          if (data.billingType === 'PIX') {
            console.log(`Getting PIX QR code for payment ${paymentData.id}`);
            
            const pixResponse = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'access_token': apiKey
              }
            });

            // Parse PIX response
            const pixData = await pixResponse.json();
            console.log(`Asaas PIX response:`, pixData);

            if (!pixResponse.ok) {
              console.error(`Error getting PIX QR code: ${pixData.errors?.[0]?.description || 'Unknown error'}`);
            } else {
              response.pix = pixData;
            }
          }
        }

        break;
      }

      case 'createSubscription': {
        console.log(`Creating subscription with data:`, data);
        
        // Validate required fields
        if (!data.customer || !data.value) {
          throw new Error('Subscription data incomplete. Customer and value are required.');
        }

        // Make API request to Asaas
        const asaasResponse = await fetch(`${baseUrl}/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          },
          body: JSON.stringify(data)
        });

        // Parse response
        const subscriptionData = await asaasResponse.json();
        console.log(`Asaas subscription response:`, subscriptionData);

        if (!asaasResponse.ok) {
          throw new Error(`Asaas API error: ${subscriptionData.errors?.[0]?.description || 'Unknown error'}`);
        }

        // Get the invoice URL from the first payment
        if (subscriptionData.id) {
          const paymentsResponse = await fetch(`${baseUrl}/subscriptions/${subscriptionData.id}/payments`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            }
          });

          const paymentsData = await paymentsResponse.json();
          console.log(`Asaas subscription payments:`, paymentsData);

          if (paymentsResponse.ok && paymentsData.data && paymentsData.data.length > 0) {
            subscriptionData.invoiceUrl = paymentsData.data[0].invoiceUrl;
          }
        }

        response = {
          success: true,
          ...subscriptionData
        };
        
        break;
      }

      case 'getPayment': {
        if (!data.id) {
          throw new Error('Payment ID is required.');
        }

        const asaasResponse = await fetch(`${baseUrl}/payments/${data.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          }
        });

        const paymentData = await asaasResponse.json();
        console.log(`Asaas get payment response:`, paymentData);

        if (!asaasResponse.ok) {
          throw new Error(`Asaas API error: ${paymentData.errors?.[0]?.description || 'Unknown error'}`);
        }

        response = {
          success: true,
          payment: paymentData
        };
        
        break;
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
