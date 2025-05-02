
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSimplifiedPayment } from "@/hooks/useSimplifiedPayment";

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
  const { createPayment, prepareCustomerDataFromProfile } = useSimplifiedPayment();
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

    let timeoutId: any;
    try {
      setIsSubscribing(true);
      // Timeout de segurança (30s)
      timeoutId = setTimeout(() => {
        setIsSubscribing(false);
        toast({
          variant: "destructive",
          title: "Tempo excedido",
          description: "A solicitação demorou demais. Tente novamente ou verifique sua conexão."
        });
      }, 30000);

      // 1. Create a new subscription in the database
      const { data: subscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: "pending", // Initial status
          payment_status: "pending",
          start_date: new Date().toISOString(),
          monthly_cost: planValue
        })
        .select()
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }

      // 2. Prepare customer data from profile
      const customerData = prepareCustomerDataFromProfile(profile);

      // Set up callback URLs
      const origin = window.location.origin;
      const successUrl = `${origin}/payment/success?subscription=${subscription.id}`;
      const failureUrl = `${origin}/payment/failure?subscription=${subscription.id}`;

      // 3. Create payment link
      const paymentResult = await createPayment({
        customerData,
        value: planValue,
        description: `Assinatura do plano ${planName}`,
        externalReference: subscription.id,
        successUrl,
        failureUrl
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error?.message || "Erro ao criar link de pagamento");
      }

      // 4. Update subscription with payment link
      await supabase
        .from("user_plan_subscriptions")
        .update({
          asaas_payment_link: paymentResult.paymentLink
        })
        .eq("id", subscription.id);

      // 5. Redirect to payment link
      if (paymentResult.paymentLink) {
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para a página de pagamento do Asaas."
        });
        
        // Redirect to payment page
        window.location.href = paymentResult.paymentLink;
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
