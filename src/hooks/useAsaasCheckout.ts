
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
  customerData?: CustomerData;
  successUrl?: string;
  failureUrl?: string;
}

export function useAsaasCheckout() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async ({
    value,
    description,
    externalReference,
    customerData,
    successUrl,
    failureUrl
  }: AsaasCheckoutProps) => {
    try {
      setIsLoading(true);

      // Create payment session with customer data
      const { data: checkoutData, error } = await supabase.functions.invoke('asaas-api', {
        body: {
          action: "createCheckoutSession",
          data: {
            customerData: customerData ? {
              name: customerData.name || "",
              cpfCnpj: customerData.cpfCnpj ? customerData.cpfCnpj.replace(/[^\d]/g, '') : "", // Clean CPF format
              email: customerData.email || "",
              phone: customerData.phone,
              address: customerData.address,
              addressNumber: customerData.addressNumber,
              complement: customerData.complement,
              postalCode: customerData.postalCode ? customerData.postalCode.replace(/[^\d]/g, '') : undefined,
              province: customerData.province
            } : undefined,
            billingTypes: ["CREDIT_CARD", "PIX"],
            chargeTypes: ["DETACHED"],
            value,
            description,
            externalReference,
            minutesToExpire: 60, // Checkout link expires in 1 hour
            callback: {
              successUrl: successUrl || `${window.location.origin}/payment/success`,
              failureUrl: failureUrl || `${window.location.origin}/payment/failure`
            }
          }
        }
      });

      if (error) {
        console.error('Error from Asaas API:', error);
        throw new Error(error.message || "Erro ao criar checkout");
      }

      if (!checkoutData || !checkoutData.id) {
        console.error('Invalid checkout data returned:', checkoutData);
        throw new Error("Resposta inválida do serviço de pagamento");
      }

      // Return the checkout URL
      const checkoutUrl = `https://asaas.com/checkoutSession/show?id=${checkoutData.id}`;
      return { success: true, checkoutUrl, checkoutData };

    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar pagamento",
        description: error.message || "Não foi possível criar o link de pagamento"
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    isLoading
  };
}
