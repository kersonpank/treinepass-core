
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Barcode, QrCode, ArrowLeft, Check, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MercadoPagoCheckout } from "./MercadoPagoCheckout";

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
      // Se for Mercado Pago, já pulamos para o checkout
      if (paymentMethod === "mercadopago") {
        setStep("checkout");
      } else {
        setStep("method");
      }
      setLoading(false);
      setCheckoutUrl(null);
      setError(null);
      setPaymentData(null);
      setIsVerifying(false);
      setRetryCount(0);
    }
  }, [open, setIsVerifying, paymentMethod]);
  
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
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Erro ao buscar dados do perfil");
      }
      
      if (!profile) {
        console.warn("Profile not found, using fallback data");
      }

      // Test if the profile has complete data
      const userHasCompleteProfile = profile && 
        profile.full_name && 
        profile.cpf && 
        (profile.email || user.email);
        
      if (!userHasCompleteProfile) {
        console.warn("User profile incomplete, using fallback data");
      }

      const checkoutResult = await createCheckoutSession({
        value: planValue,
        description: `Assinatura do plano ${planName}`,
        externalReference: newSubscription.id,
        customerData: {
          name: profile?.full_name || user.email?.split('@')[0] || "Cliente",
          cpfCnpj: profile?.cpf || "00000000000", // CPF placeholder
          email: profile?.email || user.email || "",
          phone: profile?.phone || "",
          address: profile?.address || "Sem endereço",
          addressNumber: profile?.address_number || "S/N",
          province: profile?.neighborhood || "Centro",
          postalCode: profile?.postal_code || "01310930"
        },
        paymentMethod: paymentMethod,
        successUrl: `${window.location.origin}/payment/success?subscription=${newSubscription.id}`,
        failureUrl: `${window.location.origin}/payment/failure?subscription=${newSubscription.id}`
      });
      
      console.log("Checkout result:", checkoutResult);
      
      if (!checkoutResult.success) {
        console.error("Checkout failed:", checkoutResult.error);
        throw new Error(checkoutResult.error?.message || "Erro ao criar checkout");
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
      console.log('[CheckoutDialog] setStep checkout (asaas)');
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
  
  // Criar assinatura pendente para Mercado Pago
  const createMercadoPagoPendingSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }
      
      console.log(`Creating pending subscription for Mercado Pago: plan ${planId}`);
      
      // Cancelar assinaturas pendentes anteriores
      const { error: cancelError } = await supabase
        .from('user_plan_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (cancelError) {
        console.error('Error cancelling pending subscriptions:', cancelError);
      }
      
      // Verificar se já existe uma assinatura ativa para este usuário
      const { data: activeSubscriptions } = await supabase
        .from('user_plan_subscriptions')
        .select('id, plan_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      // Se já existe uma assinatura ativa para o mesmo plano, não criamos outra
      if (activeSubscriptions && activeSubscriptions.plan_id === planId) {
        console.log('User already has an active subscription for this plan');
        toast({
          title: 'Assinatura já existente',
          description: 'Você já possui uma assinatura ativa para este plano.',
          variant: 'default',
        });
        setError('Você já possui uma assinatura ativa para este plano');
        setLoading(false);
        return null;
      }

      // Definindo o tipo explicitamente para evitar erros de tipagem
      const subscriptionData: any = {
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        payment_method: 'mercadopago',
        total_value: planValue,
        created_at: new Date().toISOString(),
      };
      
      // Criar assinatura pendente
      const { data: newSubscription, error } = await supabase
        .from('user_plan_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating pending subscription:', error);
        setError('Erro ao criar assinatura pendente');
        setLoading(false);
        return null;
      }

      console.log('[CheckoutDialog] Mercado Pago pending subscription created:', newSubscription);
      setSubscription(newSubscription);
      setLoading(false);
      return newSubscription;
    } catch (error) {
      console.error('Error in createMercadoPagoPendingSubscription:', error);
      setError(typeof error === 'string' ? error : error.message || 'Erro ao criar assinatura pendente');
      setLoading(false);
      return null;
    }
  };
  
  useEffect(() => {
    // Para métodos de pagamento que não são Mercado Pago
    if (open && paymentMethod && paymentMethod !== "mercadopago" && step === "method" && !loading && !error && retryCount === 0) {
      handleCheckout();
    }
    
    // Para Mercado Pago, criar assinatura pendente quando o diálogo for aberto
    if (open && paymentMethod === "mercadopago" && step === "checkout" && !subscription && !loading && !error) {
      console.log('[CheckoutDialog] Criando assinatura pendente Mercado Pago...');
      createMercadoPagoPendingSubscription();
    }
  }, [open, paymentMethod, step, loading, error, retryCount, subscription]);
  
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
                {paymentMethod === "mercadopago" && (
                  <>
                    <CreditCard size={20} />
                    Pagamento com Mercado Pago
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
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
              {paymentMethod === "mercadopago" && subscription?.user_id && (
                <MercadoPagoCheckout
                  planId={planId}
                  planName={planName}
                  planValue={planValue}
                  userId={subscription.user_id}
                  onSuccess={() => {
                    console.log('[CheckoutDialog] Pagamento Mercado Pago confirmado!');
                    setStep("success");
                    toast({
                      title: "Pagamento confirmado!",
                      description: "Sua assinatura foi ativada com sucesso"
                    });
                    setTimeout(() => onOpenChange(false), 3000);
                  }}
                  onError={(error) => {
                    console.error('[CheckoutDialog] Erro no pagamento Mercado Pago:', error);
                    setError(typeof error === 'string' ? error : error.message || 'Erro ao processar pagamento');
                  }}
                />
              )}
              {paymentMethod === "mercadopago" && !subscription?.user_id && (
                <div className="flex flex-col items-center gap-2 text-amber-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Aguardando inicialização do pagamento Mercado Pago...</span>
                </div>
              )}
              
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
