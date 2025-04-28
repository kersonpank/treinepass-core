
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PixInfo } from "./PixInfo";
import { BoletoInfo } from "./BoletoInfo";
import { CreditCardForm } from "./CreditCardForm";
import { useAsaasCheckout } from "@/hooks/useAsaasCheckout";
import { useClipboard } from "../hooks/useClipboard";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  planValue: number;
  paymentMethod?: string;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  planId,
  planName,
  planValue,
  paymentMethod = "pix"
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethod);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const { copiedText, handleCopyToClipboard } = useClipboard();
  const { createCheckoutSession } = useAsaasCheckout();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPaymentMethod(paymentMethod);
      setCheckoutData(null);
    }
  }, [open, paymentMethod]);

  const handleCheckout = async () => {
    if (!planId || !planValue) {
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description: "Dados do plano inválidos. Tente novamente."
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Iniciando checkout com método: ${selectedPaymentMethod}, planId: ${planId}, valor: ${planValue}`);

      // Get user data for the checkout
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Usuário não autenticado",
          description: "Faça login para continuar."
        });
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw new Error("Erro ao buscar perfil do usuário");
      }

      // Create a subscription ID to track this transaction
      const { data: subscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: "pending",
          payment_status: "pending",
          start_date: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: selectedPaymentMethod
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        throw new Error("Erro ao criar assinatura");
      }

      // Prepare customer data
      const customerData = {
        name: profile.full_name,
        cpfCnpj: profile.cpf,
        email: profile.email,
        phone: profile.phone || profile.phone_number,
        address: profile.address || "Sem endereço",
        addressNumber: profile.address_number || "S/N",
        province: profile.neighborhood || "Centro",
        postalCode: profile.postal_code || "01310930" // Default CEP for São Paulo
      };

      // Create checkout session using the specific payment method
      const response = await createCheckoutSession({
        value: planValue,
        description: `Assinatura do plano ${planName}`,
        externalReference: subscription.id,
        billingTypes: [selectedPaymentMethod.toUpperCase()],
        paymentMethod: selectedPaymentMethod,
        customerData,
        successUrl: `${window.location.origin}/payment/success?subscription=${subscription.id}`,
        failureUrl: `${window.location.origin}/payment/failure?subscription=${subscription.id}`
      });

      if (response && response.success) {
        console.log("Checkout success:", response);
        
        // Save checkout URL to subscription
        await supabase
          .from("user_plan_subscriptions")
          .update({
            asaas_payment_link: response.checkoutUrl
          })
          .eq("id", subscription.id);
          
        setCheckoutData({
          checkoutUrl: response.checkoutUrl,
          value: planValue,
          paymentMethod: selectedPaymentMethod,
          ...response
        });
        
        // If it's a redirect method (credit card), open in new window
        if (selectedPaymentMethod === "credit_card") {
          window.open(response.checkoutUrl, "_blank");
        }
      } else {
        throw new Error(response?.error || "Erro ao criar checkout");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description: error.message || "Ocorreu um erro ao processar o pagamento"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render appropriate payment info based on method and checkout data
  const renderPaymentInfo = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Processando pagamento...</p>
        </div>
      );
    }

    // If we have checkout data, show the payment info
    if (checkoutData) {
      // For credit card, show link to finish payment
      if (selectedPaymentMethod === "credit_card") {
        return (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-center">
              Para concluir sua assinatura, finalize o pagamento na janela que foi aberta.
            </p>
            <button
              className="px-4 py-2 bg-primary text-white rounded-md"
              onClick={() => window.open(checkoutData.checkoutUrl, "_blank")}
            >
              Abrir novamente
            </button>
          </div>
        );
      }
      
      // For PIX
      if (selectedPaymentMethod === "pix") {
        return (
          <PixInfo
            qrCode={checkoutData.encodedImage || checkoutData.qrCodeImage}
            code={checkoutData.payload || checkoutData.pixCode}
            value={planValue}
            onCopy={() => handleCopyToClipboard(checkoutData.payload || checkoutData.pixCode)}
          />
        );
      }
      
      // For boleto
      if (selectedPaymentMethod === "boleto") {
        return (
          <BoletoInfo
            digitableLine={checkoutData.identificationField || checkoutData.barCode}
            boletoUrl={checkoutData.bankSlipUrl || checkoutData.invoiceUrl}
            value={planValue}
            onCopy={() => handleCopyToClipboard(checkoutData.identificationField || checkoutData.barCode)}
          />
        );
      }
    }

    // Default: show payment method selection
    return (
      <div className="space-y-6 py-4">
        <Tabs 
          defaultValue={selectedPaymentMethod} 
          onValueChange={setSelectedPaymentMethod}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pix">PIX</TabsTrigger>
            <TabsTrigger value="boleto">Boleto</TabsTrigger>
            <TabsTrigger value="credit_card">Cartão de Crédito</TabsTrigger>
          </TabsList>

          <TabsContent value="pix" className="pt-4">
            <div className="text-center mb-4">
              <p>Pagamento instantâneo via PIX</p>
              <p className="text-sm text-muted-foreground">Após o pagamento, sua conta será ativada em instantes.</p>
            </div>
            
            <button 
              className="w-full py-2 bg-primary text-white rounded-md"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              Gerar QR Code PIX
            </button>
          </TabsContent>

          <TabsContent value="boleto" className="pt-4">
            <div className="text-center mb-4">
              <p>Pagamento via Boleto Bancário</p>
              <p className="text-sm text-muted-foreground">O processamento pode levar até 3 dias úteis após o pagamento.</p>
            </div>
            
            <button 
              className="w-full py-2 bg-primary text-white rounded-md"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              Gerar Boleto
            </button>
          </TabsContent>

          <TabsContent value="credit_card" className="pt-4">
            <div className="text-center mb-4">
              <p>Pagamento com Cartão de Crédito</p>
              <p className="text-sm text-muted-foreground">Você será redirecionado para um ambiente seguro para finalizar seu pagamento.</p>
            </div>
            
            <button 
              className="w-full py-2 bg-primary text-white rounded-md"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              Pagar com Cartão
            </button>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {checkoutData ? "Finalizar Pagamento" : "Escolha a forma de pagamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <div className="flex justify-between">
              <span>Plano:</span>
              <span className="font-medium">{planName}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Valor:</span>
              <span className="font-medium">R$ {planValue?.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {renderPaymentInfo()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
