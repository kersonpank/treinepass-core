import * as React from "react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Loader2 } from "lucide-react";
import { useInterval } from "@/hooks/use-interval";

interface PaymentData {
  status: string;
  value: number;
  dueDate: string;
  billingType: string;
  invoiceUrl: string;
  paymentId: string;
}

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentData | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  useInterval(
    async () => {
      if (!checkoutData?.paymentId) return;

      try {
        const { data: payment, error } = await supabase
          .from("asaas_payments")
          .select("status")
          .eq("asaas_id", checkoutData.paymentId)
          .single();

        if (error) {
          console.error("Error checking payment status:", error);
          return;
        }

        if (payment?.status === "CONFIRMED" || payment?.status === "RECEIVED") {
          toast({
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada com sucesso.",
          });
          setShowCheckout(false);
          setIsVerifyingPayment(false);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    },
    isVerifyingPayment ? 5000 : null
  );

  const handleSubscribe = async (planId: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      console.log("Creating subscription for plan:", planId);

      // Criar assinatura
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_method: "boleto",
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
        throw subscriptionError;
      }

      console.log("Subscription created:", newSubscription);

      // Criar pagamento via edge function
      const { data, error: paymentError } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "createPayment",
            subscriptionId: newSubscription.id,
            userId: user.id,
            planId: planId
          }
        }
      );

      console.log("Payment response:", data);

      if (paymentError) {
        console.error("Payment error:", paymentError);
        throw new Error(`Erro no processamento do pagamento: ${paymentError.message}`);
      }
      
      if (!data?.success || !data?.paymentData) {
        console.error("Invalid payment response:", data);
        throw new Error('Falha ao criar pagamento: Resposta inválida do servidor');
      }

      setCheckoutData(data.paymentData);
      setShowCheckout(true);
      setIsVerifyingPayment(true);

      toast({
        title: "Link de pagamento gerado!",
        description: "Você será redirecionado para a página de pagamento.",
      });

      // Redirecionar para o link de pagamento
      if (data.paymentData.invoiceUrl) {
        window.location.href = data.paymentData.invoiceUrl;
      }
    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });

      // Limpar dados em caso de erro
      setCheckoutData(null);
      setShowCheckout(false);
      setIsVerifyingPayment(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setIsVerifyingPayment(false);
  };

  const CheckoutDialog = React.memo(() => (
    <Dialog open={showCheckout} onOpenChange={handleCloseCheckout}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogDescription>
            Você será redirecionado para a página de pagamento
          </DialogDescription>
        </DialogHeader>

        {isVerifyingPayment && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Aguardando confirmação do pagamento...
              </p>
            </div>
          </div>
        )}

        {!checkoutData && (
          <div className="text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Gerando link de pagamento...
            </p>
          </div>
        )}

        {checkoutData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold">
                Valor: R$ {checkoutData.value.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Vencimento: {new Date(checkoutData.dueDate).toLocaleDateString()}
              </p>
            </div>

            {checkoutData.invoiceUrl && (
              <Button
                className="w-full"
                onClick={() => window.location.href = checkoutData.invoiceUrl}
              >
                Ir para página de pagamento
              </Button>
            )}
          </div>
        )}

        <DialogClose asChild>
          <Button variant="outline">Fechar</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  ));

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog,
  };
}
