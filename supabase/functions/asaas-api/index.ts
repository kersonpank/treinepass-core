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
  paymentLink?: string;
  value?: number;
  dueDate?: string;
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
        console.log(`Creating customer with data:`, data);
        
        // Validate required fields
        if (!data.name || !data.email || !data.cpfCnpj) {
          throw new Error('Customer data incomplete. Name, email, and cpfCnpj are required.');
        }

        // Make API request to Asaas
        const asaasResponse = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          },
          body: JSON.stringify(data)
        });

        // Parse response
        const asaasData = await asaasResponse.json();
        console.log(`Asaas response:`, asaasData);

        if (!asaasResponse.ok) {
          throw new Error(`Asaas API error: ${asaasData.errors?.[0]?.description || 'Unknown error'}`);
        }

        // Return customer data
        response = {
          success: true,
          ...asaasData
        };
        
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

        // Make API request to Asaas
        const asaasResponse = await fetch(`${baseUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          },
          body: JSON.stringify(data)
        });

        // Parse response
        const paymentData = await asaasResponse.json();
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

        break;
      }

      case 'createPaymentLink': {
        console.log(`Creating payment link with data:`, data);
        
        // Validate required fields
        if (!data.customer || !data.value) {
          throw new Error('Payment link data incomplete. Customer and value are required.');
        }
        
        // Prepare payment link request body
        const paymentLinkData = {
          customer: data.customer,
          billingType: data.billingType || "UNDEFINED",
          value: data.value,
          name: data.name || "Assinatura de Plano",
          description: data.description || "Assinatura de plano", 
          dueDateLimitDays: data.dueDateLimitDays || 5,
          maxInstallmentCount: data.maxInstallmentCount || 1,
          chargeType: data.chargeType || "DETACHED", // DETACHED for one-time payments
          externalReference: data.externalReference
        };

        console.log("Payment link request:", paymentLinkData);
        
        // Make API request to Asaas
        const asaasResponse = await fetch(`${baseUrl}/paymentLinks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          },
          body: JSON.stringify(paymentLinkData)
        });

        // Parse response
        const paymentLinkResult = await asaasResponse.json();
        console.log(`Asaas payment link response:`, paymentLinkResult);

        if (!asaasResponse.ok) {
          throw new Error(`Asaas API error: ${paymentLinkResult.errors?.[0]?.description || 'Unknown error'}`);
        }

        // Return payment link data with all needed information
        response = {
          success: true,
          id: paymentLinkResult.id,
          paymentLink: paymentLinkResult.url,
          value: paymentLinkResult.value,
          dueDate: paymentLinkResult.dueDateLimitDays 
            ? new Date(new Date().setDate(new Date().getDate() + paymentLinkResult.dueDateLimitDays)).toISOString().split('T')[0]
            : new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0]
        };
        
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
