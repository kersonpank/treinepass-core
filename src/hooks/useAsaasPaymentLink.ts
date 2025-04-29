
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";

interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
}

interface PaymentLinkParams {
  customer?: string; // ID do cliente (se já existir)
  customerData?: CustomerData; // Dados do cliente (se precisar criar)
  value: number;
  description: string;
  externalReference?: string;
  successUrl?: string;
  failureUrl?: string;
}

interface PaymentLinkResponse {
  success: boolean;
  paymentLink?: string;
  error?: {
    message: string;
    code?: string;
  };
}

export function useAsaasPaymentLink() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Cria um link de pagamento no Asaas e redireciona o usuário
   */
  const createPaymentLink = async (params: PaymentLinkParams): Promise<PaymentLinkResponse> => {
    try {
      setIsLoading(true);
      
      console.log("Criando link de pagamento com parâmetros:", params);

      // Formatar CPF/CNPJ se fornecido
      if (params.customerData?.cpfCnpj) {
        params.customerData.cpfCnpj = params.customerData.cpfCnpj.replace(/\D/g, '');
      }

      // URL base para redirecionamento de sucesso/falha
      const origin = window.location.origin;
      const successUrl = params.successUrl || `${origin}/payment/success`;
      const failureUrl = params.failureUrl || `${origin}/payment/failure`;

      // Criar ou recuperar cliente primeiro
      let customerId = params.customer;
      
      if (!customerId && params.customerData) {
        try {
          const { data: customerResult, error: customerError } = await supabase.functions.invoke(
            'asaas-api',
            {
              body: {
                action: "createCustomer",
                data: {
                  name: params.customerData.name,
                  cpfCnpj: params.customerData.cpfCnpj,
                  email: params.customerData.email,
                  phone: params.customerData.phone,
                  mobilePhone: params.customerData.mobilePhone
                }
              }
            }
          );
          
          if (customerError) throw customerError;
          customerId = customerResult.id;
          console.log("Cliente criado:", customerId);
        } catch (error) {
          console.error("Erro ao criar cliente:", error);
          // Continuar mesmo sem criar cliente, o Asaas pode criar durante o pagamento
        }
      }

      // Criar link de pagamento
      const { data, error } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "createPaymentLink",
            data: {
              customer: customerId,
              value: params.value,
              billingType: "UNDEFINED", // Cliente escolhe no checkout
              description: params.description,
              externalReference: params.externalReference,
              dueDateLimitDays: 5,
              successUrl,
              failureUrl
            }
          }
        }
      );

      if (error || !data) {
        console.error("Erro ao criar link de pagamento:", error || "Resposta vazia");
        throw new Error(error?.message || "Erro ao criar link de pagamento");
      }

      console.log("Link de pagamento criado:", data);

      // Se temos uma URL válida, salvar no histórico e redirecionar
      if (data.paymentLink || data.url) {
        const paymentLink = data.paymentLink || data.url;
        
        // Opcional: Salvar no histórico de pagamentos
        try {
          await supabase
            .from("payment_history")
            .insert({
              external_reference: params.externalReference,
              amount: params.value,
              payment_link: paymentLink,
              status: "PENDING",
              provider: "ASAAS"
            });
        } catch (historyError) {
          console.error("Erro ao salvar histórico de pagamento:", historyError);
          // Continuar mesmo se falhar o histórico
        }

        return {
          success: true,
          paymentLink
        };
      } else {
        throw new Error("Link de pagamento não encontrado na resposta");
      }
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      
      // Mensagem amigável para o usuário
      let errorMessage = "Não foi possível criar o link de pagamento";
      if (error?.message) {
        if (error.message.includes("CPF")) {
          errorMessage = "CPF/CNPJ inválido. Por favor, verifique os dados informados.";
        } else if (error.message.includes("postal") || error.message.includes("CEP")) {
          errorMessage = "CEP inválido. Por favor, verifique o endereço informado.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: errorMessage
      });
      
      return {
        success: false,
        error: {
          message: errorMessage,
          code: error?.code
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Prepara dados do cliente a partir do perfil do usuário
   */
  const prepareCustomerDataFromProfile = (profile: UserProfile): CustomerData => {
    return {
      name: profile.full_name || "",
      cpfCnpj: profile.cpf || "",
      email: profile.email || "",
      phone: profile.phone || profile.phone_number || "",
      mobilePhone: profile.mobile_phone || profile.phone || ""
    };
  };
  
  /**
   * Redireciona para o link de pagamento do Asaas
   */
  const redirectToPayment = (paymentLink: string) => {
    window.location.href = paymentLink;
  };

  return {
    createPaymentLink,
    prepareCustomerDataFromProfile,
    redirectToPayment,
    isLoading
  };
}
