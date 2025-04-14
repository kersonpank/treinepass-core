
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
  paymentMethods?: string[]; // e.g. ['CREDIT_CARD', 'PIX']
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
    failureUrl,
    paymentMethods = ['CREDIT_CARD', 'PIX']
  }: AsaasCheckoutProps) => {
    try {
      setIsLoading(true);
      console.log("Creating checkout with data:", { 
        value, description, externalReference, 
        customerData: customerData ? {...customerData} : null,
        successUrl, failureUrl
      });

      // Determine billing types based on payment methods
      const billingTypes = paymentMethods && paymentMethods.length > 0 
        ? paymentMethods 
        : ['CREDIT_CARD', 'PIX'];

      // Create payment session with customer data
      const { data: checkoutData, error } = await supabase.functions.invoke('asaas-api', {
        body: {
          action: "createCheckoutSession",
          data: {
            customerData: customerData,
            billingTypes: billingTypes,
            chargeTypes: ["DETACHED"], // Single payment
            value,
            description,
            externalReference,
            minutesToExpire: 60, // Checkout link expires in 1 hour
            callback: {
              successUrl: successUrl || `${window.location.origin}/payment/success`,
              failureUrl: failureUrl || `${window.location.origin}/payment/failure`,
              cancelUrl: `${window.location.origin}/payment/failure`
            }
          }
        }
      });

      if (error) {
        console.error('Error from Asaas API:', error);
        throw new Error(error.message || "Erro ao criar checkout");
      }

      if (!checkoutData || !checkoutData.checkoutUrl) {
        console.error('Invalid checkout data returned:', checkoutData);
        throw new Error("Resposta inválida do serviço de pagamento");
      }

      return { success: true, checkoutUrl: checkoutData.checkoutUrl, checkoutData };

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
