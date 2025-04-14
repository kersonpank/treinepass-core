
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { findOrCreateAsaasCustomer } from "./useAsaasCustomer";
import { createAsaasPayment } from "./useAsaasPayment";
import { updateSubscriptionWithPaymentDetails } from "./useSubscriptionUpdate";

export function usePaymentCreation() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createPayment = async (
    user: any,
    userProfile: any,
    planDetails: any,
    newSubscription: any,
    paymentMethod: string
  ) => {
    try {
      setIsProcessing(true);
      
      // Step 1: Create or get Asaas customer for this user
      console.log("Creating or retrieving Asaas customer for user", user.id);
      const { asaasCustomerId, customerId } = await findOrCreateAsaasCustomer(
        user.id,
        userProfile
      );

      console.log("Asaas customer ID:", asaasCustomerId);

      // Step 2: Create payment link using the customer ID
      console.log("Creating payment for subscription:", newSubscription.id);

      // Define URLs de redirecionamento para sucesso e falha
      const returnSuccessUrl = `${window.location.origin}/payment/success?subscription=${newSubscription.id}`;
      const returnFailureUrl = `${window.location.origin}/payment/failure?subscription=${newSubscription.id}`;

      // Create payment link allowing customer to choose payment method
      const paymentResponse = await createAsaasPayment({
        customer: asaasCustomerId,
        planName: planDetails.name,
        planCost: planDetails.monthly_cost,
        paymentMethod: paymentMethod.toLowerCase(), // Just for reference
        subscriptionId: newSubscription.id,
        successUrl: returnSuccessUrl,
        failureUrl: returnFailureUrl
      });

      console.log("Payment service response:", paymentResponse);
      
      // Check for valid response - Support both payment object and direct paymentLink responses
      if (!paymentResponse || (!paymentResponse.payment && !paymentResponse.paymentLink && !paymentResponse.id)) {
        throw new Error("Empty or invalid payment response");
      }
      
      // Set defaults for response parsing
      let paymentStatus = "PENDING";
      let paymentValue = planDetails.monthly_cost;
      let paymentDueDate = new Date().toISOString().split('T')[0];
      let paymentId = "";
      let billingType = paymentMethod.toLowerCase();
      let invoiceUrl = "";
      let paymentLinkUrl = "";
      let pixData = undefined;

      // Handle different response formats
      if (paymentResponse.payment) {
        // Standard payment response with payment object
        paymentStatus = paymentResponse.payment.status;
        paymentValue = paymentResponse.payment.value;
        paymentDueDate = paymentResponse.payment.dueDate;
        paymentId = paymentResponse.payment.id;
        billingType = paymentResponse.payment.billingType;
        invoiceUrl = paymentResponse.payment.invoiceUrl;
        paymentLinkUrl = paymentResponse.payment.paymentLink || paymentResponse.payment.invoiceUrl;
        pixData = paymentResponse.pix;
      } else if (paymentResponse.paymentLink || paymentResponse.id) {
        // Direct payment link response
        paymentId = paymentResponse.id || "";
        paymentValue = paymentResponse.value || planDetails.monthly_cost;
        paymentDueDate = paymentResponse.dueDate || paymentDueDate;
        paymentLinkUrl = paymentResponse.paymentLink || "";
        invoiceUrl = paymentLinkUrl; // Use paymentLink as invoiceUrl
      }

      // Step 3: Update subscription with payment link and customer ID
      const paymentUrl = paymentLinkUrl || invoiceUrl;
      if (paymentUrl) {
        await updateSubscriptionWithPaymentDetails(
          newSubscription.id, 
          paymentUrl, 
          asaasCustomerId
        );
      }

      // Return payment data for further processing
      return {
        status: paymentStatus,
        value: paymentValue,
        dueDate: paymentDueDate,
        billingType: billingType,
        invoiceUrl: invoiceUrl || paymentLinkUrl || "", 
        paymentId: paymentId,
        paymentLink: paymentLinkUrl || invoiceUrl || "", 
        pix: pixData,
        customerId,
        asaasCustomerId
      };
    } catch (error: any) {
      console.error("Error processing payment:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createPayment,
    isProcessing,
    setIsProcessing
  };
}
