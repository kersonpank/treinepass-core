
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatCustomerData } from '@/utils/customerDataFormatter';

export interface CheckoutConfig {
  value: number;
  description: string;
  externalReference: string;
  customerData?: any;
  billingTypes?: string[];
  successUrl?: string;
  failureUrl?: string;
}

export function useAsaasCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async (config: CheckoutConfig) => {
    try {
      setIsLoading(true);
      
      // Garantir URLs de callback absolutas
      const origin = window.location.origin;
      const successUrl = config.successUrl || `${origin}/payment/success?subscription=${config.externalReference}`;
      const failureUrl = config.failureUrl || `${origin}/payment/failure?subscription=${config.externalReference}`;
      
      // Formatar dados do cliente
      const formattedCustomerData = formatCustomerData(config.customerData || {});
      
      // Montar dados do checkout
      const checkoutData = {
        externalReference: config.externalReference,
        value: config.value,
        billingTypes: config.billingTypes || ["CREDIT_CARD", "PIX"],
        chargeTypes: ["DETACHED"], // Pagamento único
        minutesToExpire: 60,
        items: [{
          name: config.description,
          value: config.value,
          quantity: 1
        }],
        customerData: formattedCustomerData,
        callback: {
          successUrl,
          failureUrl,
          cancelUrl: failureUrl
        }
      };

      console.log("Creating checkout with data:", checkoutData);
      
      // Chamar a Edge Function para criar o checkout
      const { data, error } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "createCheckout",
            data: checkoutData
          }
        }
      );

      if (error) {
        console.error("Error from Asaas API:", error);
        throw error;
      }

      console.log("Checkout created successfully:", data);
      
      return {
        success: true,
        ...data
      };

    } catch (error: any) {
      console.error("Error creating checkout:", error);
      return {
        success: false,
        error
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
