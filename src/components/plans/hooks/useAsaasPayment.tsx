
import { supabase } from "@/integrations/supabase/client";

interface PaymentConfig {
  customer: string;
  planName: string;
  planCost: number;
  paymentMethod: string;
  subscriptionId: string;
}

export interface PaymentResponse {
  success: boolean;
  payment: {
    id: string;
    status: string;
    value: number;
    dueDate: string;
    billingType: string;
    invoiceUrl: string;
  };
  pix?: {
    encodedImage?: string;
    payload?: string;
  };
}

export async function createAsaasPayment(config: PaymentConfig): Promise<PaymentResponse> {
  const { customer, planName, planCost, paymentMethod, subscriptionId } = config;
  
  try {
    // Call Edge function to create payment in Asaas
    const { data, error } = await supabase.functions.invoke(
      'asaas-api',
      {
        body: {
          action: "createPayment",
          data: {
            customer,
            billingType: paymentMethod.toUpperCase(),
            value: planCost,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
            description: `Assinatura empresarial do plano ${planName}`,
            externalReference: subscriptionId
          }
        }
      }
    );

    if (error) {
      console.error("Erro no pagamento:", error);
      throw new Error(`Erro no processamento do pagamento: ${error.message}`);
    }
    
    if (!data?.success || !data?.payment) {
      console.error("Resposta de pagamento inválida:", data);
      throw new Error('Falha ao criar pagamento: Resposta inválida do servidor');
    }

    return data as PaymentResponse;
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error);
    throw error;
  }
}

interface PaymentDataToSave {
  asaasId: string;
  customerId?: string; 
  subscriptionId: string;
  amount: number;
  billingType: string;
  status: string;
  dueDate: string;
  paymentLink: string;
}

export async function savePaymentData(paymentData: PaymentDataToSave) {
  try {
    const { error } = await supabase
      .from("asaas_payments")
      .insert({
        asaas_id: paymentData.asaasId,
        customer_id: paymentData.customerId,
        subscription_id: paymentData.subscriptionId,
        amount: paymentData.amount,
        billing_type: paymentData.billingType,
        status: paymentData.status,
        due_date: paymentData.dueDate,
        payment_link: paymentData.paymentLink,
        external_reference: paymentData.subscriptionId
      });

    if (error) {
      console.error("Erro ao salvar dados de pagamento:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar dados de pagamento:", error);
    throw error;
  }
}
