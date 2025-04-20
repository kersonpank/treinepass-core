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

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  value: number;
  cycle: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  billingTypes?: ("BOLETO" | "CREDIT_CARD" | "PIX")[];
  maxCharges?: number; // Número máximo de cobranças (null para ilimitado)
  externalReference?: string;
}

interface CreateSubscriptionProps {
  customerData: AsaasCustomerData;
  plan: SubscriptionPlan;
  nextDueDate?: Date | string;
  successUrl?: string;
  failureUrl?: string;
}

export function useSubscription() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createSubscription = async ({
    customerData,
    plan,
    nextDueDate,
    successUrl,
    failureUrl
  }: CreateSubscriptionProps) => {
    try {
      setIsLoading(true);
      console.log("Creating subscription with data:", { 
        customerData: {...customerData},
        plan,
        nextDueDate,
        successUrl, 
        failureUrl
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
      
      // Abordagem em duas etapas: primeiro criar o cliente, depois a assinatura
      try {
        // Passo 1: Criar o cliente
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
            externalReference: customerData.externalReference || plan.externalReference
          }
        };
        
        console.log("Creating customer first:", createCustomerPayload);
        const { data: customerResult, error: customerError } = await supabase.functions.invoke('asaas-api', {
          body: createCustomerPayload
        });
        
        if (customerError) {
          console.error("Error creating customer:", customerError);
          throw new Error(customerError.message || "Erro ao criar cliente");
        }
        
        console.log("Customer created/found:", customerResult);
        
        // Passo 2: Criar a assinatura com o ID do cliente
        const subscriptionPayload = {
          action: "createSubscription",
          data: {
            customer: customerResult.id, // Usar o ID do cliente que acabamos de criar
            value: plan.value,
            cycle: plan.cycle || "MONTHLY",
            // Usar billingTypes como array em vez de billingType para compatibilidade com a API v3
            billingTypes: plan.billingTypes || ["BOLETO", "CREDIT_CARD", "PIX"],
            nextDueDate: nextDueDate || new Date(new Date().setDate(new Date().getDate() + 7)),
            description: plan.description || `Assinatura ${plan.name}`,
            externalReference: plan.externalReference,
            maxCharges: plan.maxCharges || null,
            planName: plan.name,
            successUrl: successUrl || `${origin}/payment/success?subscription=${plan.externalReference}`,
            failureUrl: failureUrl || `${origin}/payment/failure?subscription=${plan.externalReference}`
          }
        };
        
        console.log("Creating subscription with customer ID:", subscriptionPayload);
        
        // Chamar a Edge Function para criar a assinatura
        const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('asaas-api', {
          body: subscriptionPayload
        });
        
        if (subscriptionError) {
          console.error("Error returned by Edge Function:", subscriptionError);
          throw new Error(subscriptionError.message || "Erro ao criar assinatura");
        }
        
        if (!subscriptionData || !subscriptionData.id) {
          console.error('Invalid subscription data returned:', subscriptionData);
          throw new Error("Resposta inválida do serviço de assinatura");
        }
        
        console.log("Subscription created successfully:", subscriptionData);
        
        // Return subscription data
        return { 
          success: true, 
          subscriptionId: subscriptionData.id,
          customerId: customerResult.id,
          value: subscriptionData.value || plan.value,
          nextDueDate: subscriptionData.nextDueDate,
          invoiceUrl: subscriptionData.invoiceUrl, // URL para pagamento da primeira fatura
          paymentLink: subscriptionData.invoiceUrl, // Para compatibilidade com o fluxo atual
          cycle: subscriptionData.cycle || plan.cycle,
          externalReference: plan.externalReference
        };
      } catch (innerError: any) {
        console.error("Error in subscription flow:", innerError);
        throw innerError; // Propagar o erro para ser tratado no catch externo
      }
    } catch (error: any) {
      // Detailed logging
      console.error('Error creating subscription:', {
        error,
        message: error?.message,
        response: error?.response,
        data: error?.data,
        stack: error?.stack,
      });
      
      // User-friendly error message
      let errorMessage = "Não foi possível criar a assinatura";
      
      if (error?.message) {
        if (error.message.includes("CPF")) {
          errorMessage = "CPF/CNPJ inválido. Por favor, verifique os dados informados.";
        } else if (error.message.includes("postalCode")) {
          errorMessage = "CEP inválido. Por favor, verifique o CEP informado.";
        } else if (error.message.includes("Edge Function")) {
          errorMessage = "Erro na conexão com o serviço de pagamento. Tente novamente em alguns instantes.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao criar assinatura",
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
    createSubscription,
    prepareCustomerDataFromProfile,
    isLoading
  };
}
