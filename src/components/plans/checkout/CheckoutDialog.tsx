import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Barcode, QrCode, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PixInfo } from "./PixInfo";
import { BoletoInfo } from "./BoletoInfo";
import { CreditCardForm } from "./CreditCardForm";
import { useAsaasCheckout } from "@/hooks/useAsaasCheckout";
import { useSubscriptionUpdate } from "../hooks/useSubscriptionCreation";
import { usePaymentStatusChecker } from "../hooks/usePaymentStatusChecker";
import { createSubscriptionRecord, updateSubscriptionWithPaymentDetails, saveSubscriptionPaymentData } from "../hooks/useSubscriptionUpdate";
import { supabase } from "@/integrations/supabase/client";
import { extractAsaasApiToken } from "@/utils/asaas-helpers";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  planValue: number;
  paymentMethod: string;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  planId,
  planName,
  planValue,
  paymentMethod,
}: CheckoutDialogProps) {
  const [step, setStep] = useState<"method" | "checkout" | "success">("method");
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const { toast } = useToast();
  const { createCheckoutSession, isLoading } = useAsaasCheckout();
  
  const { isVerifying, setIsVerifying } = usePaymentStatusChecker({
    paymentId: paymentId || undefined,
    onPaymentConfirmed: () => {
      setStep("success");
      toast({
        title: "Pagamento confirmado!",
        description: "Sua assinatura foi ativada com sucesso"
      });
      setTimeout(() => onOpenChange(false), 3000);
    }
  });
  
  useEffect(() => {
    if (open) {
      setStep("method");
      setLoading(false);
      setCheckoutUrl(null);
      setError(null);
      setPaymentData(null);
      setIsVerifying(false);
      setRetryCount(0);
    }
  }, [open]);
  
  const handleCloseDialog = () => {
    if (step === "checkout" && !error) {
      const confirmed = window.confirm("Deseja realmente cancelar esta operação? O pagamento não será processado.");
      if (confirmed) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    setStep("method");
    setError(null);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }
      
      console.log(`Starting checkout for plan ${planId} with method ${paymentMethod}`);
      
      const newSubscription = await createSubscriptionRecord(user.id, planId, paymentMethod);
      if (!newSubscription) {
        throw new Error("Erro ao criar registro de assinatura");
      }
      
      setSubscription(newSubscription);
      console.log("Subscription created:", newSubscription);

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (profileError) {
        throw new Error("Erro ao buscar dados do perfil");
      }

      const checkoutResult = await createCheckoutSession({
        value: planValue,
        description: `Assinatura do plano ${planName}`,
        externalReference: newSubscription.id,
        customerData: {
          name: profile.full_name,
          cpfCnpj: profile.cpf,
          email: profile.email || user.email,
          phone: profile.phone || "",
          address: profile.address || "Sem endereço",
          addressNumber: profile.address_number || "S/N",
          province: profile.neighborhood || "Centro",
          postalCode: profile.postal_code || "01310930"
        },
        paymentMethod: paymentMethod,
        successUrl: `${window.location.origin}/payment/success?subscription=${newSubscription.id}`,
        failureUrl: `${window.location.origin}/payment/failure?subscription=${newSubscription.id}`
      });
      
      console.log("Checkout result:", checkoutResult);
      
      if (!checkoutResult.success) {
        throw new Error(checkoutResult.error || "Erro ao criar checkout");
      }

      await updateSubscriptionWithPaymentDetails(
        newSubscription.id, 
        checkoutResult.checkoutUrl, 
        checkoutResult.customerId || ""
      );

      if (checkoutResult.id) {
        setPaymentId(checkoutResult.id);
        await saveSubscriptionPaymentData({
          asaasId: checkoutResult.id,
          customerId: checkoutResult.customerId || "",
          subscriptionId: newSubscription.id,
          amount: planValue,
          billingType: paymentMethod.toUpperCase(),
          status: "PENDING",
          dueDate: new Date().toISOString(),
          invoiceUrl: checkoutResult.checkoutUrl || ""
        });
      }

      setPaymentData({
        method: paymentMethod,
        value: planValue,
        checkoutUrl: checkoutResult.checkoutUrl,
        paymentId: checkoutResult.id,
        qrCode: checkoutResult.encodedImage,
        code: checkoutResult.payload,
        digitableLine: checkoutResult.digitableLine,
        boletoUrl: checkoutResult.bankSlipUrl
      });

      setCheckoutUrl(checkoutResult.checkoutUrl);
      setStep("checkout");

      if (checkoutResult.id) {
        setIsVerifying(true);
      }
      
    } catch (error) {
      console.error("Checkout error:", error);
      
      let errorMessage = error.message || "Erro ao processar pagamento";
      
      if (error.message && (
          error.message.includes("Invalid API key") || 
          error.message.includes("Authentication error") || 
          error.message.includes("401"))) {
        errorMessage = "Erro de autenticação com o Asaas. Por favor, verifique as configurações da API.";
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (open && paymentMethod && step === "method" && !loading && !error && retryCount === 0) {
      handleCheckout();
    }
  }, [open, paymentMethod, step]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    handleCheckout();
  };

  const handleCopy = () => {
    toast({
      title: "Código copiado!",
      description: "O código foi copiado para a área de transferência"
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "method" ? (
              "Processando pagamento..."
            ) : step === "checkout" ? (
              <>
                {paymentMethod === "pix" && (
                  <>
                    <QrCode size={20} />
                    Pagamento via PIX
                  </>
                )}
                {paymentMethod === "boleto" && (
                  <>
                    <Barcode size={20} />
                    Boleto Bancário
                  </>
                )}
                {paymentMethod === "credit_card" && (
                  <>
                    <CreditCard size={20} />
                    Cartão de Crédito
                  </>
                )}
              </>
            ) : (
              <>
                <Check size={20} className="text-green-500" />
                Pagamento Confirmado
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Processando pagamento...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                <p className="text-sm font-medium">Erro no processamento: {error}</p>
              </div>
              <Button onClick={handleRetry} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          )}
          
          {!loading && !error && step === "checkout" && (
            <>
              {paymentMethod === "pix" && paymentData && (
                <PixInfo
                  qrCode={paymentData.qrCode}
                  code={paymentData.code}
                  value={planValue}
                  onCopy={handleCopy}
                />
              )}
              
              {paymentMethod === "boleto" && paymentData && (
                <BoletoInfo
                  digitableLine={paymentData.digitableLine}
                  boletoUrl={paymentData.boletoUrl || paymentData.checkoutUrl}
                  value={planValue}
                  onCopy={handleCopy}
                />
              )}
              
              {paymentMethod === "credit_card" && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-center">
                    Para concluir seu pagamento com cartão de crédito, clique no botão abaixo:
                  </p>
                  
                  {checkoutUrl ? (
                    <Button
                      className="w-full"
                      onClick={() => window.open(checkoutUrl, "_blank")}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Finalizar pagamento
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </Button>
                  )}
                </div>
              )}
              
              {checkoutUrl && paymentMethod !== "credit_card" && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>Se preferir, você também pode pagar clicando no link abaixo:</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => window.open(checkoutUrl, "_blank")}
                  >
                    Abrir página de pagamento
                  </Button>
                </div>
              )}
            </>
          )}
          
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Pagamento confirmado!</h3>
              <p className="text-sm text-muted-foreground">
                Sua assinatura foi ativada com sucesso.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "checkout" && (
            <Button variant="outline" onClick={handleCloseDialog}>
              Fechar
            </Button>
          )}
          
          {step === "success" && (
            <Button onClick={handleCloseDialog}>
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
