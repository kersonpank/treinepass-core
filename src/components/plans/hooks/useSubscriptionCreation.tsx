
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPlanCheckoutDialog } from "../checkout/BusinessPlanCheckoutDialog";
import { usePaymentStatusChecker } from "./usePaymentStatusChecker";
import { usePaymentCreation } from "./usePaymentCreation"; 
import { useClipboard } from "./useClipboard";
import { 
  createSubscriptionRecord, 
  saveSubscriptionPaymentData 
} from "./useSubscriptionUpdate";
import { UserProfile, PaymentData } from "@/types/user";

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentData | null>(null);
  
  const { copiedText, handleCopyToClipboard } = useClipboard();
  const { createPayment } = usePaymentCreation();
  
  const { isVerifying: isVerifyingPayment, setIsVerifying: setIsVerifyingPayment } = usePaymentStatusChecker({
    paymentId: checkoutData?.paymentId,
    onPaymentConfirmed: () => {
      setShowCheckout(false);
    }
  });

  const handleSubscribe = async (planId: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      // Não precisamos mais normalizar o método de pagamento
      // O usuário escolherá o método diretamente no link de pagamento do Asaas
      
      setIsSubscribing(true);
      
      // Verificar autenticação do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar detalhes do plano
      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      // Buscar perfil do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
      }

      // Criar registro de assinatura no banco de dados
      const newSubscription = await createSubscriptionRecord(user.id, planId, 'undefined'); // Método indefinido, o usuário escolherá no Asaas

      try {
        // Simplificamos o processo - não precisamos mais preparar os dados do usuário
        // O usePaymentCreation já cuida disso usando o useSimplifiedPayment

        // Criar pagamento usando o hook simplificado
        const paymentInfo = await createPayment(
          user,
          userProfile,
          planDetails,
          newSubscription
        );
        
        // Registrar dados do pagamento
        await saveSubscriptionPaymentData(paymentInfo, newSubscription.id);

        // Configurar dados para o checkout
        setCheckoutData({
          status: "pending",
          value: paymentInfo.value,
          dueDate: paymentInfo.dueDate,
          billingType: null, // Permitir que o usuário escolha no checkout do Asaas
          invoiceUrl: paymentInfo.checkoutUrl,
          paymentId: paymentInfo.paymentId,
          paymentLink: paymentInfo.checkoutUrl,
          pix: null // Não temos informações de PIX ainda, usuário escolherá no Asaas
        });
        
        toast({
          title: "Link de pagamento gerado!",
          description: "Você será redirecionado para a página de pagamento."
        });

        // Redirecionar para o link de pagamento
        const redirectUrl = paymentInfo.checkoutUrl;
        
        if (redirectUrl) {
          // Melhor abordagem para redirecionar - primeiro tentar abrir em nova janela
          // e depois redirecionar na mesma janela como fallback
          const newWindow = window.open(redirectUrl, '_blank');
          
          // Fallback se o popup for bloqueado
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.log("Popup bloqueado, redirecionando na mesma janela...");
            // Dar tempo para o usuário ver o toast antes de redirecionar
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1500);
          }
        } else {
          // Se não tivermos URL, mostrar o checkout interno
          setShowCheckout(true);
          console.error("Link de pagamento não encontrado na resposta");
        }
        
        return newSubscription;
      } catch (paymentError: any) {
        console.error("[Asaas] Erro ao processar pagamento:", paymentError);
        throw paymentError;
      }
    } catch (error: any) {
      // Logging detalhado
      console.error("Erro detalhado ao assinar plano:", {
        error,
        message: error?.message,
        response: error?.response,
        data: error?.data,
        stack: error?.stack,
      });
      
      // Mensagem de erro mais amigável para o usuário
      let errorMessage = "Ocorreu um erro ao processar sua solicitação";
      
      // Tratar erros específicos de forma mais amigável
      if (error?.message?.includes("postalCode")) {
        errorMessage = "Não foi possível processar o pagamento: CEP inválido";
      } else if (error?.message?.includes("Edge Function")) {
        errorMessage = "Erro na conexão com o serviço de pagamento. Tente novamente.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: errorMessage,
      });
      
      return null;
    } finally {
      setIsSubscribing(false);
    }
  };


  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setIsVerifyingPayment(false);
  };

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog: () => (
      <BusinessPlanCheckoutDialog
        showCheckout={showCheckout}
        handleCloseCheckout={handleCloseCheckout}
        checkoutData={checkoutData}
        isVerifyingPayment={isVerifyingPayment}
        copiedText={copiedText}
        handleCopyToClipboard={handleCopyToClipboard}
      />
    ),
  };
}
