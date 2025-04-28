
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  province?: string;
  postalCode?: string;
}

interface CheckoutSessionProps {
  value: number;
  description: string;
  externalReference: string;
  customerData?: CustomerData;
  billingTypes?: string[];
  paymentMethod?: string;
  items?: Array<{
    name: string;
    value: number;
    quantity: number;
  }>;
  successUrl?: string;
  failureUrl?: string;
}

export function useAsaasCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (props: CheckoutSessionProps) => {
    try {
      setIsLoading(true);
      console.log("Creating checkout session with props:", props);

      if (!props.value || isNaN(props.value) || props.value <= 0) {
        throw new Error("Valor inválido para checkout");
      }

      // Prepare data for the edge function
      const data = {
        value: props.value,
        description: props.description,
        externalReference: props.externalReference,
        customerData: props.customerData,
        paymentMethod: props.paymentMethod, // Support for specific payment method
        billingTypes: props.billingTypes || ["CREDIT_CARD", "PIX", "BOLETO"],
        items: props.items || [
          {
            name: props.description,
            value: props.value,
            quantity: 1
          }
        ],
        callback: {
          successUrl: props.successUrl || `${window.location.origin}/payment/success?subscription=${props.externalReference}`,
          failureUrl: props.failureUrl || `${window.location.origin}/payment/failure?subscription=${props.externalReference}`,
          autoRedirect: true
        }
      };

      // Call the edge function to create the checkout
      const { data: response, error } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: 'initiateCheckout',
            data
          }
        }
      );

      if (error) {
        console.error("Error creating checkout:", error);
        throw error;
      }

      console.log("Checkout response:", response);
      return response;
    } catch (error: any) {
      console.error("Failed to create checkout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar checkout",
        description: error.message || "Não foi possível criar a sessão de checkout"
      });
      return {
        success: false,
        error: error.message || "Falha ao criar checkout"
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
