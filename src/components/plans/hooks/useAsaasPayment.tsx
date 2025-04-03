
import { supabase } from "@/integrations/supabase/client";

interface PaymentConfig {
  customer: string;
  planName: string;
  planCost: number;
  paymentMethod: string;
  subscriptionId: string;
}

export interface PaymentResponse {
  success?: boolean;
  payment?: {
    id: string;
    status: string;
    value: number;
    dueDate: string;
    billingType: string;
    invoiceUrl: string;
    paymentLink?: string;
  };
  pix?: {
    encodedImage?: string;
    payload?: string;
  };
  // Payment link direct response fields
  id?: string;
  paymentLink?: string;
  value?: number;
  dueDate?: string;
}

export async function createAsaasPayment(config: PaymentConfig): Promise<PaymentResponse> {
  const { customer, planName, planCost, paymentMethod, subscriptionId } = config;
  
  try {
    // Call Edge function to create payment in Asaas
    const { data, error } = await supabase.functions.invoke(
      'asaas-api',
      {
        body: {
          action: "createPaymentLink",
          data: {
            customer,
            billingType: paymentMethod || "UNDEFINED", // Use specified method or let customer choose
            value: planCost,
            name: `Plano ${planName}`,
            description: `Assinatura do plano ${planName}`,
            dueDateLimitDays: 5,
            chargeType: "DETACHED",
            externalReference: subscriptionId
          }
        }
      }
    );

    if (error) {
      console.error("Erro no pagamento:", error);
      throw new Error(`Erro no processamento do pagamento: ${error.message}`);
    }
    
    console.log("Resposta do createPaymentLink:", data);
    
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
  invoiceUrl: string;  // Using invoiceUrl to match DB schema
}

export async function savePaymentData(paymentData: PaymentDataToSave) {
  try {
    console.log("Salvando dados de pagamento:", paymentData);
    
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
        invoice_url: paymentData.invoiceUrl,
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
