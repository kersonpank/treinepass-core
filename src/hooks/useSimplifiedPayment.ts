import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";

interface AsaasCustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

interface SimplifiedPaymentProps {
  value: number;
  description: string;
  externalReference: string;
  customerData: AsaasCustomerData;
  successUrl?: string;
  failureUrl?: string;
}

export function useSimplifiedPayment() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createPayment = async ({
    value,
    description,
    externalReference,
    customerData,
    successUrl,
    failureUrl
  }: SimplifiedPaymentProps) => {
    try {
      setIsLoading(true);
      console.log("Creating simplified payment with data:", { 
        value, description, externalReference, 
        customerData: {...customerData},
        successUrl, failureUrl
      });

      // Format postal code properly if provided
      if (customerData.postalCode) {
        customerData.postalCode = customerData.postalCode.replace(/\D/g, '');
      }

      // Format CPF/CNPJ properly
      if (customerData.cpfCnpj) {
        customerData.cpfCnpj = customerData.cpfCnpj.replace(/[^\d]/g, '');
      }

      // Format phone properly if provided
      if (customerData.phone) {
        customerData.phone = customerData.phone.replace(/\D/g, '');
      }

      // Get origin for callback URLs
      const origin = window.location.origin || 'https://app.treinepass.com.br';
      
      // Abordagem em duas etapas: primeiro criar o cliente, depois o link de pagamento
      // Isso garante que os dados do cliente estejam preenchidos no link de pagamento
      
      // Verificar se a descrição contém a palavra 'assinatura' ou 'plano'
      const isSubscription = description.toLowerCase().includes('assinatura') || 
                          description.toLowerCase().includes('plano');
      
      // Declarar a variável payload fora do bloco try/catch
      let payload;
      
      try {
        // Passo 1: Criar o cliente
        console.log("Step 1: Creating customer first...");
        const createCustomerPayload = {
          action: "createCustomer",
          data: {
            name: customerData.name,
            cpfCnpj: customerData.cpfCnpj,
            email: customerData.email,
            phone: customerData.phone || customerData.mobilePhone,
            mobilePhone: customerData.mobilePhone || customerData.phone,
            address: customerData.address || "Av. Paulista",
            addressNumber: customerData.addressNumber || "1000",
            province: customerData.province || "Bela Vista",
            postalCode: customerData.postalCode || "01310930", // CEP válido para São Paulo
            externalReference: customerData.externalReference || externalReference
          }
        };
        
        const { data: customerResult, error: customerError } = await supabase.functions.invoke('asaas-api', {
          body: createCustomerPayload
        });
        
        if (customerError) {
          console.error("Error creating customer:", customerError);
          throw new Error(customerError.message || "Erro ao criar cliente");
        }
        
        console.log("Customer created/found:", customerResult);
        
        // Passo 2: Criar uma sessão de checkout com o ID do cliente
        console.log("Step 2: Creating checkout session with customer ID...");
        
        // Criar um objeto com todos os dados necessários para o checkout
        const checkoutData: any = {
          customerData: {
            id: customerResult.id, // Usar o ID do cliente que acabamos de criar
            name: customerData.name,
            cpfCnpj: customerData.cpfCnpj,
            email: customerData.email,
            phone: customerData.phone || customerData.mobilePhone,
            mobilePhone: customerData.mobilePhone || customerData.phone,
            address: customerData.address || "Av. Paulista",
            addressNumber: customerData.addressNumber || "1000",
            province: customerData.province || "Bela Vista",
            postalCode: customerData.postalCode || "01310930" // CEP válido para São Paulo
          },
          preencherDados: true, // Preencher os dados do cliente automaticamente
          value,
          description,
          externalReference,
          chargeTypes: ["DETACHED"], // Cobrança avulsa
          minutesToExpire: 60, // Sessão expira em 60 minutos
          callback: {
            successUrl: successUrl || `${origin}/payment/success?subscription=${externalReference}`,
            failureUrl: failureUrl || `${origin}/payment/failure?subscription=${externalReference}`,
            cancelUrl: failureUrl || `${origin}/payment/failure?subscription=${externalReference}`
          }
        };
        
        // Usar paymentMethodCodes em vez de billingTypes (importante para compatibilidade com a API v3)
        checkoutData.paymentMethodCodes = ["BOLETO", "CREDIT_CARD", "PIX"];
        
        // Montar o payload final
        payload = {
          action: "createCheckoutSession",
          data: checkoutData
        };
        
        console.log("Payment link payload:", payload);
      } catch (innerError) {
        // Se falhar a abordagem em duas etapas, usar o fallback com dados completos do cliente
        console.error("Error in two-step approach:", innerError);
        console.log("Falling back to direct checkout session creation...");
        
        // Criar um objeto com todos os dados necessários para o checkout (fallback)
        const checkoutData: any = {
          customerData: {
            name: customerData.name,
            cpfCnpj: customerData.cpfCnpj,
            email: customerData.email,
            phone: customerData.phone || customerData.mobilePhone,
            mobilePhone: customerData.mobilePhone || customerData.phone,
            address: customerData.address || "Av. Paulista",
            addressNumber: customerData.addressNumber || "1000",
            province: customerData.province || "Bela Vista",
            postalCode: customerData.postalCode || "01310930" // CEP válido para São Paulo
          },
          preencherDados: true, // Preencher os dados do cliente automaticamente
          value,
          description,
          externalReference,
          chargeTypes: ["DETACHED"], // Cobrança avulsa
          minutesToExpire: 60, // Sessão expira em 60 minutos
          callback: {
            successUrl: successUrl || `${origin}/payment/success?subscription=${externalReference}`,
            failureUrl: failureUrl || `${origin}/payment/failure?subscription=${externalReference}`,
            cancelUrl: failureUrl || `${origin}/payment/failure?subscription=${externalReference}`
          },
          paymentMethodCodes: ["BOLETO", "CREDIT_CARD", "PIX"]
        };
        
        // Montar o payload final para o fallback
        payload = {
          action: "createCheckoutSession",
          data: checkoutData
        };
      }
      
      // Fazer a requisição para a API do Asaas
      console.log("Sending payload to Asaas API:", payload);
      const { data: result, error } = await supabase.functions.invoke('asaas-api', {
        body: payload
      });
      
      if (error) {
        console.error("Error creating payment:", error);
        throw new Error(error.message || "Erro ao criar pagamento");
      }
      
      console.log("Payment created successfully:", result);
      
      // Verificar se temos uma URL de checkout ou link de pagamento válido
      const redirectUrl = result.checkoutUrl || result.paymentLink;
      if (!redirectUrl) {
        throw new Error("Não foi possível gerar a URL de pagamento");
      }
      
      // Redirecionar para a URL de checkout ou link de pagamento
      window.location.href = redirectUrl;
      
      // Return payment data
      return { 
        success: true, 
        paymentLink: redirectUrl, 
        paymentId: result.id,
        customer: customerData.cpfCnpj,
        value: result.value || value,
        dueDate: result.dueDate || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
        externalReference: externalReference
      };
    } catch (error: any) {
      // Detailed logging
      console.error('Error creating payment:', {
        error,
        message: error?.message,
        response: error?.response,
        data: error?.data,
        stack: error?.stack,
      });
      
      // User-friendly error message
      let errorMessage = "Não foi possível criar o link de pagamento";
      
      if (error?.message) {
        if (error.message.includes("CPF")) {
          errorMessage = "CPF/CNPJ inválido. Por favor, verifique os dados informados.";
        } else if (error.message.includes("postalCode")) {
          errorMessage = "CEP inválido. Por favor, verifique o CEP informado.";
        } else if (error.message.includes("Edge Function")) {
          errorMessage = "Erro na conexão com o serviço de pagamento. Tente novamente em alguns instantes.";
        } else if (error.message.includes("mobilePhone")) {
          errorMessage = "Número de telefone inválido. Por favor, verifique o número informado.";
        } else {
          errorMessage = error.message;
        }
      }
      
      // Removemos o código que tentava salvar o histórico de pagamento
      // pois a tabela 'payment_history' pode não existir no banco de dados
      
      toast({
        variant: "destructive",
        title: "Erro ao criar pagamento",
        description: errorMessage
      });
      
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

  /**
   * Helper function to prepare customer data from user profile
   */
  const prepareCustomerDataFromProfile = (profile: UserProfile): AsaasCustomerData => {
    return {
      name: profile.full_name,
      cpfCnpj: profile.cpf,
      email: profile.email,
      phone: profile.phone || profile.phone_number,
      postalCode: profile.postal_code || "",
      address: profile.address,
      addressNumber: profile.address_number,
      complement: profile.complement,
      province: profile.neighborhood,
      externalReference: profile.id
    };
  };

  return {
    createPayment,
    prepareCustomerDataFromProfile,
    isLoading
  };
}
