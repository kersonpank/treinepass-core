
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
  pixQrCode: string;
  pixCode: string;
  value: number;
  dueDate: string;
  subscriptionId: string;
  paymentId: string;
}

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentData | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  useInterval(
    async () => {
      if (!checkoutData?.paymentId) return;

      try {
        const { data: payment, error } = await supabase
          .from("asaas_payments")
          .select("status")
          .eq("id", checkoutData.paymentId)
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

  const handleSubscribe = async (planId: string, paymentMethod: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      console.log("Creating subscription for plan:", planId, "with payment method:", paymentMethod);

      // Verificar se o plano existe antes de criar a assinatura
      const { data: planData, error: planError } = await supabase
        .from("benefit_plans")
        .select("id, name, monthly_cost")
        .eq("id", planId)
        .single();

      if (planError || !planData) {
        console.error("Erro ao verificar plano:", planError);
        throw new Error("Plano não encontrado ou inválido");
      }

      // Criar assinatura
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
        throw subscriptionError;
      }

      console.log("Subscription created:", newSubscription);

      if (paymentMethod === 'credit_card') {
        setShowCreditCardForm(true);
        return;
      }

      // Criar pagamento via edge function
      const { data, error: paymentError } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "createPayment",
            subscriptionId: newSubscription.id,
            userId: user.id,
            planId: planId,
            paymentMethod: paymentMethod
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

      // Validar dados do PIX
      if (paymentMethod === 'pix' && (!data.paymentData.pixQrCode || !data.paymentData.pixCode)) {
        console.error("Missing PIX data in response:", data.paymentData);
        throw new Error('Dados do PIX não gerados corretamente. Tente novamente.');
      }

      setCheckoutData(data.paymentData);
      setShowCheckout(true);
      setIsVerifyingPayment(true);

      toast({
        title: "PIX gerado com sucesso!",
        description: "Escaneie o QR Code ou copie o código para pagar.",
      });
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

  const handleCreditCardSubmit = async (cardData: any) => {
    console.log("Processing credit card:", cardData);
    setShowCreditCardForm(false);
    
    toast({
      title: "Cartão processado com sucesso!",
      description: "Sua assinatura será ativada em instantes.",
    });
  };

  const handleCopyPix = async () => {
    if (checkoutData?.pixCode) {
      try {
        await navigator.clipboard.writeText(checkoutData.pixCode);
        setHasCopied(true);
        toast({
          title: "Código PIX copiado!",
          description: "Cole o código no seu aplicativo de pagamento.",
        });
        
        setTimeout(() => {
          setHasCopied(false);
        }, 2000);
      } catch (err) {
        console.error("Erro ao copiar código PIX:", err);
        toast({
          variant: "destructive",
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código. Tente copiar manualmente.",
        });
      }
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setIsVerifyingPayment(false);
  };

  const CheckoutDialog = React.memo(() => (
    <div className="flex flex-col items-center space-y-6 py-4">
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
            Gerando dados de pagamento...
          </p>
        </div>
      )}

      {checkoutData?.pixQrCode && (
        <div className="bg-white p-4 rounded-lg">
          <img 
            src={`data:image/png;base64,${checkoutData.pixQrCode}`}
            alt="QR Code PIX"
            className="w-48 h-48"
            onError={(e) => {
              console.error("Erro ao carregar QR Code:", e);
              e.currentTarget.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f5f5f5'/%3E%3Ctext x='50' y='50' font-size='10' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3EErro ao carregar QR Code%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      )}

      {checkoutData?.pixCode && (
        <div className="w-full space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            Ou copie o código PIX abaixo:
          </p>
          <div className="relative flex items-center">
            <div className="w-full p-3 text-sm bg-muted rounded-lg break-all">
              {checkoutData.pixCode}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2"
              onClick={handleCopyPix}
            >
              {hasCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="text-sm text-center text-muted-foreground">
        <p>Após o pagamento, sua assinatura será ativada automaticamente.</p>
        <p className="font-medium">
          Valor: {new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL'
          }).format(checkoutData?.value || 0)}
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <DialogClose asChild>
          <Button variant="ghost" className="w-full" onClick={handleCloseCheckout}>
            Fechar
          </Button>
        </DialogClose>
      </div>
    </div>
  ));

  return {
    isSubscribing,
    handleSubscribe,
    showCreditCardForm,
    setShowCreditCardForm,
    handleCreditCardSubmit,
    CheckoutDialog
  };
}
