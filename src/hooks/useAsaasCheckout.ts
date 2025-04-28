
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

interface CheckoutResponse {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
  id?: string;
  value?: number;
  customerId?: string;
  encodedImage?: string; // For PIX QR code
  payload?: string; // For PIX code
  digitableLine?: string; // For boleto
  bankSlipUrl?: string; // For boleto
}

export function useAsaasCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (props: CheckoutSessionProps): Promise<CheckoutResponse> => {
    try {
      setIsLoading(true);
      console.log("Creating checkout session with props:", props);

      if (!props.value || isNaN(props.value) || props.value <= 0) {
        throw new Error("Valor inválido para checkout");
      }

      // Map payment method to billing types if needed
      let billingTypes = props.billingTypes;
      if (props.paymentMethod && !billingTypes) {
        switch(props.paymentMethod.toLowerCase()) {
          case 'pix':
            billingTypes = ['PIX'];
            break;
          case 'credit_card':
            billingTypes = ['CREDIT_CARD'];
            break;
          case 'boleto':
            billingTypes = ['BOLETO'];
            break;
          default:
            billingTypes = ['CREDIT_CARD', 'PIX', 'BOLETO'];
        }
      }

      // Prepare data for the edge function
      const requestData = {
        value: props.value,
        description: props.description,
        externalReference: props.externalReference,
        customerData: props.customerData,
        paymentMethod: props.paymentMethod, 
        billingTypes: billingTypes || ['CREDIT_CARD', 'PIX', 'BOLETO'],
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

      // Add additional timeout for network issues
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: The request took too long to complete")), 30000);
      });

      // Call the edge function with timeout
      const responsePromise = supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: 'initiateCheckout',
            data: requestData
          }
        }
      );

      // Race between the actual API call and the timeout
      const { data, error } = await Promise.race([
        responsePromise,
        timeoutPromise.then(() => ({ data: null, error: new Error("Timeout: The request took too long to complete") }))
      ]) as { data: any, error: any };

      if (error) {
        console.error("Error creating checkout:", error);
        return {
          success: false,
          error: error.message || "Falha na comunicação com o servidor"
        };
      }

      // Check if response has expected format
      if (!data || (!data.checkoutUrl && !data.success)) {
        console.error("Invalid response format:", data);
        return {
          success: false,
          error: "Resposta inválida do servidor de pagamento"
        };
      }

      return {
        success: true,
        ...data
      };
    } catch (error: any) {
      console.error("Failed to create checkout:", error);
      
      return {
        success: false,
        error: error.message || "Não foi possível criar a sessão de checkout"
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
