
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSimplifiedPayment } from "@/hooks/useSimplifiedPayment";
import { findOrCreateAsaasCustomer } from "./useAsaasCustomer";
import { UserProfile, AsaasCustomerData, PaymentData } from "@/types/user";

export function usePaymentCreation() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { createPayment, prepareCustomerDataFromProfile } = useSimplifiedPayment();

  const processPayment = async (
    user: any,
    userProfile: UserProfile,
    planDetails: any,
    newSubscription: any
  ) => {
    try {
      setIsProcessing(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuário não autenticado");

      // Get user profile for complete info
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
      }

      // Ensure we have the minimum required customer data
      if (!profile.full_name || !profile.cpf) {
        throw new Error("Dados de usuário incompletos. Nome e CPF são obrigatórios.");
      }

      console.log("Creating payment with profile data:", {
        name: profile.full_name,
        cpf: profile.cpf,
        email: profile.email
      });
      
      // Prepare customer data from user profile
      const customerData = prepareCustomerDataFromProfile(profile);
      
      // Garantir que temos URLs absolutas para callbacks
      const origin = window.location.origin || 'https://app.treinepass.com.br';
      const successUrl = `${origin}/payment/success?subscription=${newSubscription.id}`;
      const failureUrl = `${origin}/payment/failure?subscription=${newSubscription.id}`;
      
      console.log("[Asaas] Criando pagamento simplificado");
      
      // Criar pagamento usando o método simplificado
      const paymentResponse = await createPayment({
        customerData,
        value: planDetails.monthly_cost,
        description: `Assinatura do plano ${planDetails.name}`,
        externalReference: newSubscription.id,
        successUrl,
        failureUrl
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error?.message || "Erro ao criar link de pagamento");
      }

      // Atualizar assinatura com link de pagamento e outros dados
      await supabase
        .from("user_plan_subscriptions")
        .update({
          asaas_payment_link: paymentResponse.paymentLink,
          payment_status: "pending", // Status inicial
          // Não definimos o método de pagamento, o usuário escolherá no Asaas
          updated_at: new Date().toISOString()
        })
        .eq("id", newSubscription.id);
        
      console.log("Subscription updated with payment link:", paymentResponse.paymentLink);

      return {
        success: true,
        checkoutUrl: paymentResponse.paymentLink,
        paymentId: paymentResponse.paymentId,
        value: paymentResponse.value,
        dueDate: paymentResponse.dueDate,
        customerId: typeof paymentResponse.customer === 'object' ? paymentResponse.customer?.id : (paymentResponse.customer || '')
      };


    } catch (error: any) {
      // Logging detalhado
      console.error("[Asaas] Error processing payment:", {
        error,
        message: error?.message,
        response: error?.response,
        data: error?.data,
        stack: error?.stack,
      });
      
      // Tratar mensagens de erro específicas
      let errorMessage = "Ocorreu um erro ao processar sua solicitação";
      let errorSolution = "";
      
      if (error?.message?.includes("postalCode")) {
        errorMessage = "CEP inválido para processamento do pagamento";
        errorSolution = "Tente novamente selecionando a opção para preencher seus dados manualmente.";
      } else if (error?.message?.includes("Edge Function")) {
        errorMessage = "Erro na conexão com o serviço de pagamento. Tente novamente em alguns instantes.";
      } else if (error?.message?.includes("callback")) {
        errorMessage = "Erro nas URLs de redirecionamento";
        errorSolution = "Por favor, tente novamente ou contate o suporte.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Adicionar solução à mensagem de erro, se houver
      const fullErrorMessage = errorSolution ? `${errorMessage}. ${errorSolution}` : errorMessage;
      
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: fullErrorMessage,
      });
      
      // Modificar o erro para incluir a mensagem completa
      if (error) {
        error.message = fullErrorMessage;
        error.originalMessage = error.message;
        error.solution = errorSolution;
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };


  return {
    createPayment: processPayment,
    isProcessing
  };
}
