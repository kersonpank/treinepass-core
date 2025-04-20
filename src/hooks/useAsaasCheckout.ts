
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  postalCode?: string;
  province?: string;
}

export interface AsaasCheckoutProps {
  value: number;
  description: string;
  externalReference: string;
  customer?: string; // Novo campo opcional para ID do cliente Asaas
  customerData?: CustomerData;
  successUrl?: string;
  failureUrl?: string;
  paymentMethods?: string[]; // e.g. ['CREDIT_CARD', 'PIX']
}

export function useAsaasCheckout() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // billingTypes agora é obrigatório
  const createCheckoutSession = async ({
    value,
    description,
    externalReference,
    customer,
    customerData,
    preencherDados, // Nova opção para controlar se os dados serão preenchidos
    successUrl,
    failureUrl,
    billingTypes, // NOVO: obrigatório
    chargeTypes,
    items
  }: {
    value: number;
    description: string;
    externalReference: string;
    customer?: string;
    customerData?: any;
    preencherDados?: boolean; // Flag para controlar se os dados serão preenchidos
    successUrl: string;
    failureUrl: string;
    billingTypes: string[];
    chargeTypes?: string[];
    items?: any[];
  }) => {
    try {
      setIsLoading(true);
      if (!billingTypes || !Array.isArray(billingTypes)) {
        throw new Error("O método de pagamento (billingTypes) não foi definido corretamente. Por favor, selecione uma forma de pagamento.");
      }
      console.log("Creating checkout with data:", { 
        value, description, externalReference, 
        customer, customerData: customerData ? {...customerData} : null,
        successUrl, failureUrl, billingTypes, chargeTypes, items
      });

      const payload: any = {
        value,
        description,
        externalReference,
        successUrl,
        failureUrl,
        billingTypes,
      };
      if (customer) payload.customer = customer;
      if (customerData) payload.customerData = customerData;

      // Se quiser forçar métodos específicos, descomente abaixo
      


      // Format postal code properly
      let formattedPostalCode = "";
      if (customerData?.postalCode) {
        formattedPostalCode = customerData.postalCode.replace(/\D/g, '');
      }
      // Função para validar CEP real
      const isValidCep = (cep: string) => !!cep && cep.length === 8 && cep !== "00000000";

      // Clean customer data
      let cleanedCustomerData = undefined;
      if (customerData) {
        cleanedCustomerData = {
          name: customerData.name,
          cpfCnpj: customerData.cpfCnpj,
          email: customerData.email,
          phone: customerData.phone || undefined
        };
        // Só adiciona endereço se for cartão de crédito
        if (billingTypes.includes('CREDIT_CARD')) {
          cleanedCustomerData = {
            ...cleanedCustomerData,
            address: customerData.address || "Endereço não informado",
            addressNumber: customerData.addressNumber || "S/N",
            province: customerData.province || "Centro",
            // Se for recorrente e CEP não for válido, usa um genérico real
            postalCode: isValidCep(formattedPostalCode) ? formattedPostalCode : "01001000",
            complement: customerData.complement || undefined
          };
        } else {
          // Pagamento avulso: só envia postalCode se for válido
          if (isValidCep(formattedPostalCode)) {
            cleanedCustomerData.postalCode = formattedPostalCode;
          }
        }
      }

      // Monta o payload corretamente
      const checkoutPayload: any = {
        billingTypes: billingTypes,
        chargeTypes: chargeTypes,
        value,
        description,
        externalReference,
        preencherDados, // Adiciona a flag para controlar se os dados serão preenchidos
        minutesToExpire: 60
      };
      
      // Adicionar URLs de callback garantindo que são absolutas
      const origin = window.location.origin || 'https://app.treinepass.com.br';
      
      // Garantir que as URLs são válidas e completas
      checkoutPayload.callback = {
        successUrl: successUrl || `${origin}/payment/success`,
        failureUrl: failureUrl || `${origin}/payment/failure`,
        cancelUrl: failureUrl || `${origin}/payment/failure`
      };
      
      // Adiciona os dados do cliente apenas se preencherDados for true
      if (preencherDados && cleanedCustomerData) {
        checkoutPayload.customerData = cleanedCustomerData;
      } else {
        // Se não preencherDados, garantir que não enviamos dados do cliente
        delete checkoutPayload.customerData;
      }

      // Log detalhado do payload
      console.log("[Asaas] Payload enviado para Edge Function:", checkoutPayload);

      // Corrigir: enviar payload dentro de 'data'
      const body = {
        action: "createCheckoutSession",
        data: checkoutPayload
      };
      console.log("[Asaas] Body enviado para Edge Function:", body);
      const { data: checkoutData, error } = await supabase.functions.invoke('asaas-api', {
        body
      });

      if (error) {
        // Log detalhado da resposta de erro
        console.error("[Asaas] Erro retornado pela Edge Function:", error);
        
        // Tratar mensagens de erro específicas
        let errorMessage = error.message || "Erro desconhecido ao criar checkout";
        
        // Melhorar mensagens de erro para o usuário
        if (errorMessage.includes("postalCode")) {
          errorMessage = "CEP inválido. Por favor, verifique o CEP ou escolha preencher seus dados manualmente.";
        } else if (errorMessage.includes("callback")) {
          errorMessage = "Erro nas URLs de redirecionamento. Tente novamente ou contate o suporte.";
        }
        
        toast({
          variant: "destructive",
          title: "Erro ao criar checkout",
          description: errorMessage
        });
        throw new Error(errorMessage);
      }

      if (!checkoutData || !(checkoutData.checkoutUrl || checkoutData.id)) {
        console.error('Invalid checkout data returned:', checkoutData);
        throw new Error("Resposta inválida do serviço de pagamento");
      }
      
      // Verificar se estamos em ambiente de produção ou sandbox
      const isProduction = !window.location.hostname.includes('localhost') && 
                          !window.location.hostname.includes('127.0.0.1') &&
                          !window.location.hostname.includes('sandbox');
      
      // Asaas pode retornar apenas o id, então monta a URL se necessário
      const asaasBaseUrl = isProduction ? 'https://www.asaas.com' : 'https://sandbox.asaas.com';
      const checkoutUrl = checkoutData.checkoutUrl || `${asaasBaseUrl}/checkoutSession/${checkoutData.id}`;
      
      console.log("[Asaas] Checkout URL gerada:", checkoutUrl);
      return { success: true, checkoutUrl, checkoutData };


    } catch (error: any) {
      // Logging detalhado
      console.error('Error creating checkout:', {
        error,
        message: error?.message,
        response: error?.response,
        data: error?.data,
        stack: error?.stack,
      });
      
      // Melhorar mensagens de erro para o usuário
      let errorMessage = "Não foi possível criar o link de pagamento";
      
      if (error?.message) {
        if (error.message.includes("postalCode")) {
          errorMessage = "CEP inválido. Por favor, verifique o CEP ou escolha preencher seus dados manualmente.";
        } else if (error.message.includes("callback")) {
          errorMessage = "Erro nas URLs de redirecionamento. Tente novamente.";
        } else if (error.message.includes("Edge Function")) {
          errorMessage = "Erro na conexão com o serviço de pagamento. Tente novamente em alguns instantes.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao criar pagamento",
        description: errorMessage
      });
      
      // Retornar erro com mensagem melhorada
      return { 
        success: false, 
        error: { 
          ...error, 
          message: errorMessage,
          originalMessage: error?.message
        } 
      };
    } finally {
      setIsLoading(false);
    }
  };


  return {
    createCheckoutSession,
    isLoading
  };
}
