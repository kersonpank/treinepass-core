
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createAsaasPayment, savePaymentData } from "./useAsaasPayment";
import { updateSubscriptionPaymentDetails } from "./useBusinessSubscription";

export function useBusinessPaymentCreation() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createBusinessPayment = async (
    planDetails: any,
    subscription: any,
    asaasCustomerId: string,
    paymentMethod: string
  ) => {
    try {
      setIsProcessing(true);
      console.log("Criando pagamento para assinatura:", subscription.id);
      
      const paymentResponse = await createAsaasPayment({
        customer: asaasCustomerId,
        planName: planDetails.name,
        planCost: planDetails.monthly_cost,
        paymentMethod: paymentMethod,
        subscriptionId: subscription.id
      });
      
      console.log("Resposta do serviço de pagamento:", paymentResponse);
      
      if (!paymentResponse || (!paymentResponse.payment && !paymentResponse.paymentLink && !paymentResponse.id)) {
        throw new Error("Resposta de pagamento inválida ou incompleta");
      }

      // Parse payment information
      const paymentInfo = parsePaymentResponse(paymentResponse, planDetails.monthly_cost);

      // Save payment data
      await savePaymentData({
        asaasId: paymentInfo.paymentId,
        customerId: asaasCustomerId,
        subscriptionId: subscription.id,
        amount: paymentInfo.value,
        billingType: paymentInfo.billingType,
        status: paymentInfo.status,
        dueDate: paymentInfo.dueDate,
        invoiceUrl: paymentInfo.invoiceUrl || paymentInfo.paymentLink || ""
      });

      // Update subscription with payment details
      await updateSubscriptionPaymentDetails({
        subscriptionId: subscription.id,
        paymentLink: paymentInfo.paymentLink || paymentInfo.invoiceUrl || "",
        customerId: asaasCustomerId,
        paymentMethod: paymentMethod,
        totalValue: planDetails.monthly_cost
      });

      return paymentInfo;
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      throw new Error(`Falha ao criar pagamento: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createBusinessPayment,
    isProcessing
  };
}

// Helper function to parse payment response
function parsePaymentResponse(paymentResponse: any, defaultAmount: number) {
  let paymentStatus = "PENDING";
  let paymentValue = defaultAmount;
  let paymentDueDate = new Date().toISOString().split('T')[0];
  let paymentId = "";
  let billingType = "undefined";
  let invoiceUrl = "";
  let paymentLinkUrl = "";
  let pixData = undefined;

  // Handle different response formats
  if (paymentResponse.payment) {
    paymentStatus = paymentResponse.payment.status;
    paymentValue = paymentResponse.payment.value;
    paymentDueDate = paymentResponse.payment.dueDate;
    paymentId = paymentResponse.payment.id;
    billingType = paymentResponse.payment.billingType;
    invoiceUrl = paymentResponse.payment.invoiceUrl;
    paymentLinkUrl = paymentResponse.payment.paymentLink || paymentResponse.payment.invoiceUrl;
    pixData = paymentResponse.pix;
  } else if (paymentResponse.paymentLink || paymentResponse.id) {
    paymentId = paymentResponse.id || "";
    paymentValue = paymentResponse.value || defaultAmount;
    paymentDueDate = paymentResponse.dueDate || paymentDueDate;
    paymentLinkUrl = paymentResponse.paymentLink || "";
    invoiceUrl = paymentResponse.paymentLink || "";
  }

  return {
    status: paymentStatus,
    value: paymentValue,
    dueDate: paymentDueDate,
    billingType,
    invoiceUrl: invoiceUrl || paymentLinkUrl || "",
    paymentId,
    paymentLink: paymentLinkUrl || invoiceUrl || "",
    pix: pixData
  };
}
