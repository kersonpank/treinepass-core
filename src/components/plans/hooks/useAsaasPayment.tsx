
import { supabase } from "@/integrations/supabase/client";

interface PaymentConfig {
  customer: string;
  planName: string;
  planCost: number;
  paymentMethod: string;
  subscriptionId: string;
  successUrl?: string;
  failureUrl?: string;
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
  try {
    // For payment links, we'll use UNDEFINED to allow customer to choose payment method
    // This is the recommended approach from Asaas docs for payment links
    const billingType = "UNDEFINED";
    
    console.log(`Creating payment link with billing type: ${billingType}`);
    
    // Define URLs para redirecionamento após pagamento
    const returnSuccessUrl = config.successUrl || `${window.location.origin}/payment/success?subscription=${config.subscriptionId}`;
    const returnFailureUrl = config.failureUrl || `${window.location.origin}/payment/failure?subscription=${config.subscriptionId}`;
    
    // Call Edge function to create payment in Asaas
    const { data, error } = await supabase.functions.invoke(
      'asaas-api',
      {
        body: {
          action: "createPaymentLink",
          data: {
            customer: config.customer,
            billingType, // Use UNDEFINED to allow customer to choose payment method
            value: config.planCost,
            name: `Plano ${config.planName}`,
            description: `Assinatura do plano ${config.planName}`,
            dueDateLimitDays: 5,
            chargeType: "DETACHED",
            externalReference: config.subscriptionId,
            maxInstallmentCount: 12, // Allow up to 12 installments for credit card
            notificationEnabled: true,
            successUrl: returnSuccessUrl,
            failureUrl: returnFailureUrl
          }
        }
      }
    );

    if (error) {
      console.error("Error in payment:", error);
      throw new Error(`Erro no processamento do pagamento: ${error.message}`);
    }
    
    console.log("Payment link response:", data);
    
    return data as PaymentResponse;
  } catch (error: any) {
    console.error("Error creating payment:", error);
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
    console.log("Saving payment data:", paymentData);
    
    // Convert Asaas status to our internal status format
    const paymentStatus = mapAsaasStatusToInternal(paymentData.status);
    
    const { error } = await supabase
      .from("asaas_payments")
      .insert({
        asaas_id: paymentData.asaasId,
        customer_id: paymentData.customerId,
        subscription_id: paymentData.subscriptionId,
        amount: paymentData.amount,
        billing_type: paymentData.billingType,
        status: paymentStatus,
        due_date: paymentData.dueDate,
        invoice_url: paymentData.invoiceUrl,
        external_reference: paymentData.subscriptionId
      });

    if (error) {
      console.error("Error saving payment data:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error saving payment data:", error);
    throw error;
  }
}

// Helper function to map Asaas status to our internal status
function mapAsaasStatusToInternal(asaasStatus: string): string {
  switch (asaasStatus) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "RECEIVED";
    case "PENDING":
    case "AWAITING_RISK_ANALYSIS":
      return "PENDING";
    case "OVERDUE":
      return "OVERDUE";
    case "REFUNDED":
    case "REFUND_REQUESTED":
      return "REFUNDED";
    case "CANCELLED":
      return "CANCELED";
    default:
      return "PENDING";
  }
}
