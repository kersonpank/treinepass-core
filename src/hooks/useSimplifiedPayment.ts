
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/user';

interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  province?: string;
}

interface PaymentRequest {
  customerData: CustomerData;
  value: number;
  description: string;
  externalReference?: string;
  successUrl?: string;
  failureUrl?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentLink?: string;
  invoiceUrl?: string;
  value?: number;
  dueDate?: string;
  customer?: any;
  error?: {
    message: string;
    code?: string;
  };
}

export function useSimplifiedPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      setIsLoading(true);
      
      console.log("Creating payment link with Asaas SDK:", request);
      
      // Call our edge function to create a payment link
      const { data, error } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "sdkCreatePaymentLink",
            data: {
              customerData: request.customerData,
              name: request.description,
              description: request.description,
              value: request.value,
              externalReference: request.externalReference,
              maxInstallmentCount: 12,
              billingTypes: ["BOLETO", "CREDIT_CARD", "PIX"],
              dueDateLimitDays: 7,
              successUrl: request.successUrl,
              failureUrl: request.failureUrl
            }
          }
        }
      );

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      console.log("Payment response:", data);
      
      if (!data.success) {
        throw new Error(data.error?.message || "Erro ao criar link de pagamento");
      }
      
      return {
        success: true,
        paymentId: data.id,
        paymentLink: data.url || data.paymentLink,
        invoiceUrl: data.url || data.paymentLink,
        value: request.value,
        customer: data.customerId,
        dueDate: data.dueDate
      };
      
    } catch (error: any) {
      console.error("Error creating payment:", error);
      
      toast({
        variant: "destructive",
        title: "Erro no pagamento",
        description: error.message || "Não foi possível processar o pagamento"
      });
      
      return {
        success: false,
        error: {
          message: error.message || "Erro desconhecido",
          code: error.code
        }
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper to convert profile data to customer data format
  const prepareCustomerDataFromProfile = (profile: UserProfile): CustomerData => {
    return {
      name: profile.full_name || "",
      cpfCnpj: profile.cpf || profile.cnpj || "",
      email: profile.email || "",
      phone: profile.phone || profile.phone_number || "",
      mobilePhone: profile.mobile_phone || profile.phone || "",
      postalCode: profile.postal_code || "",
      address: profile.address || "",
      addressNumber: profile.address_number || "",
      complement: profile.complement || "",
      neighborhood: profile.neighborhood || "",
      city: profile.city || "",
      province: profile.state || ""
    };
  };

  return {
    createPayment,
    isLoading,
    prepareCustomerDataFromProfile
  };
}
