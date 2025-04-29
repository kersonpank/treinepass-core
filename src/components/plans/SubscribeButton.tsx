
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAsaasPaymentLink } from "@/hooks/useAsaasPaymentLink";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SubscribeButtonProps {
  planId: string;
  planName: string;
  planValue: number;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
}

export function SubscribeButton({
  planId,
  planName,
  planValue,
  className = "",
  variant = "default"
}: SubscribeButtonProps) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { user, profile } = useAuth();
  const { createPaymentLink, prepareCustomerDataFromProfile, redirectToPayment } = useAsaasPaymentLink();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Faça login primeiro",
        description: "Você precisa estar logado para assinar um plano."
      });
      return;
    }

    if (!profile) {
      toast({
        variant: "destructive",
        title: "Perfil incompleto",
        description: "Complete seu perfil antes de assinar um plano."
      });
      return;
    }

    try {
      setIsSubscribing(true);

      // 1. Criar uma nova assinatura no banco de dados
      const { data: subscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: "pending", // Status inicial
          payment_status: "pending",
          start_date: new Date().toISOString(),
          monthly_cost: planValue
        })
        .select()
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }

      // 2. Preparar dados do cliente a partir do perfil
      const customerData = prepareCustomerDataFromProfile(profile);

      // 3. Criar link de pagamento
      const paymentResult = await createPaymentLink({
        customerData,
        value: planValue,
        description: `Assinatura do plano ${planName}`,
        externalReference: subscription.id,
        successUrl: `${window.location.origin}/payment/success?subscription=${subscription.id}`,
        failureUrl: `${window.location.origin}/payment/failure?subscription=${subscription.id}`
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error?.message || "Erro ao criar link de pagamento");
      }

      // 4. Atualizar a assinatura com o link de pagamento
      await supabase
        .from("user_plan_subscriptions")
        .update({
          asaas_payment_link: paymentResult.paymentLink
        })
        .eq("id", subscription.id);

      // 5. Redirecionar para o link de pagamento
      if (paymentResult.paymentLink) {
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para a página de pagamento do Asaas."
        });
        redirectToPayment(paymentResult.paymentLink);
      }
    } catch (error: any) {
      console.error("Erro ao processar assinatura:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar assinatura",
        description: error.message || "Ocorreu um erro ao processar sua assinatura."
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe} 
      disabled={isSubscribing}
      className={className}
      variant={variant}
    >
      {isSubscribing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        "Assinar"
      )}
    </Button>
  );
}
