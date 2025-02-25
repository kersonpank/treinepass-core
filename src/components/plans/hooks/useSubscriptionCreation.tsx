
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function useSubscriptionCreation() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const handleSubscribe = async (planId: string) => {
    try {
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Criar assinatura como pending
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_method: "pix"
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // 2. Criar cliente e pagamento no Asaas
      const { data, error: paymentError } = await supabase.functions.invoke(
        'asaas-customer',
        {
          body: {
            subscriptionId: newSubscription.id,
            planId: planId,
            paymentMethod: 'pix'
          }
        }
      );

      if (paymentError) throw new Error(paymentError.message);
      
      if (!data?.success) {
        throw new Error('Falha ao criar pagamento');
      }

      // 3. Mostrar checkout em um modal
      console.log("Payment data received:", data);
      setCheckoutData(data.paymentData);
      setShowCheckout(true);

      toast({
        title: "Plano reservado!",
        description: "Por favor, complete o pagamento para ativar sua assinatura.",
      });
    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCopyPix = async () => {
    if (checkoutData?.pixCode) {
      await navigator.clipboard.writeText(checkoutData.pixCode);
      setHasCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole o código no seu aplicativo de pagamento.",
      });
      
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }
  };

  const CheckoutDialog = React.memo(() => (
    <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 p-4">
          {checkoutData?.pixQrCode && (
            <div className="bg-white p-4 rounded-lg">
              <img 
                src={`data:image/png;base64,${checkoutData.pixQrCode}`}
                alt="QR Code PIX"
                className="w-48 h-48"
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
            <p>Valor: R$ {checkoutData?.value?.toFixed(2)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ));

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog
  };
}
