
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
  pix?: {
    encodedImage?: string;
    payload?: string;
  };
}

export function useBusinessPlanSubscription() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentData | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
          console.error("Erro ao verificar status do pagamento:", error);
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
        console.error("Erro ao verificar status do pagamento:", error);
      }
    },
    isVerifyingPayment ? 5000 : null
  );

  const handleSubscribe = async (planId: string, paymentMethod: string = "pix", businessId?: string) => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get business profile if not provided
      let businessProfileId = businessId;
      if (!businessProfileId) {
        const { data: businessProfile, error: businessError } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (businessError || !businessProfile) {
          throw new Error("Perfil de empresa não encontrado");
        }
        
        businessProfileId = businessProfile.id;
      }

      console.log("Criando assinatura de plano para empresa:", businessProfileId, "plano:", planId, "método de pagamento:", paymentMethod);

      // Get plan details
      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      // Criar assinatura como pendente
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("business_plan_subscriptions")
        .insert({
          business_id: businessProfileId,
          plan_id: planId,
          user_id: user.id,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
        throw subscriptionError;
      }

      console.log("Assinatura empresarial criada:", newSubscription);

      // Verificar se o usuário já tem um cliente Asaas
      const { data: existingCustomer, error: customerError } = await supabase
        .from("asaas_customers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (customerError && customerError.code !== "PGRST116") {
        throw customerError;
      }

      let asaasCustomerId = existingCustomer?.asaas_id;

      // Se não existir, criar um novo cliente no Asaas
      if (!asaasCustomerId) {
        // Get business profile for full info
        const { data: businessProfile, error: profileError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", businessProfileId)
          .single();

        if (profileError) {
          throw new Error(`Erro ao buscar perfil da empresa: ${profileError.message}`);
        }

        const { data: customerData, error: createCustomerError } = await supabase.functions.invoke(
          'asaas-api',
          {
            body: {
              action: "createCustomer",
              data: {
                name: businessProfile.company_name,
                email: businessProfile.contact_email || user.email,
                cpfCnpj: businessProfile.cnpj
              }
            }
          }
        );

        if (createCustomerError || !customerData?.id) {
          throw new Error(`Erro ao criar cliente no Asaas: ${createCustomerError?.message || "Resposta inválida"}`);
        }

        // Save customer data
        const { error: saveCustomerError } = await supabase
          .from("asaas_customers")
          .insert({
            user_id: user.id,
            asaas_id: customerData.id,
            name: businessProfile.company_name,
            email: businessProfile.contact_email || user.email,
            cpf_cnpj: businessProfile.cnpj
          });

        if (saveCustomerError) {
          throw saveCustomerError;
        }

        asaasCustomerId = customerData.id;
      }

      // Criar pagamento via edge function
      const { data, error: paymentError } = await supabase.functions.invoke(
        'asaas-api',
        {
          body: {
            action: "createPayment",
            data: {
              customer: asaasCustomerId,
              billingType: paymentMethod.toUpperCase(),
              value: planDetails.monthly_cost,
              dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
              description: `Assinatura empresarial do plano ${planDetails.name}`,
              externalReference: newSubscription.id
            }
          }
        }
      );

      console.log("Resposta do pagamento:", data);

      if (paymentError) {
        console.error("Erro no pagamento:", paymentError);
        throw new Error(`Erro no processamento do pagamento: ${paymentError.message}`);
      }
      
      if (!data?.success || !data?.payment) {
        console.error("Resposta de pagamento inválida:", data);
        throw new Error('Falha ao criar pagamento: Resposta inválida do servidor');
      }

      // Salvar dados do pagamento
      const { error: savePaymentError } = await supabase
        .from("asaas_payments")
        .insert({
          asaas_id: data.payment.id,
          customer_id: existingCustomer?.id,
          subscription_id: newSubscription.id,
          amount: data.payment.value,
          billing_type: data.payment.billingType,
          status: data.payment.status,
          due_date: data.payment.dueDate,
          payment_link: data.payment.invoiceUrl,
          external_reference: newSubscription.id
        });

      if (savePaymentError) {
        throw savePaymentError;
      }

      // Atualizar assinatura com informações de pagamento
      const { error: updateSubscriptionError } = await supabase
        .from("business_plan_subscriptions")
        .update({
          asaas_payment_link: data.payment.invoiceUrl,
          asaas_customer_id: asaasCustomerId,
          payment_method: paymentMethod,
          total_value: planDetails.monthly_cost
        })
        .eq("id", newSubscription.id);

      if (updateSubscriptionError) {
        throw updateSubscriptionError;
      }

      // Preparar dados para o diálogo de checkout
      const checkoutData: PaymentData = {
        status: data.payment.status,
        value: data.payment.value,
        dueDate: data.payment.dueDate,
        billingType: data.payment.billingType,
        invoiceUrl: data.payment.invoiceUrl,
        paymentId: data.payment.id
      };

      // Se pagamento PIX, incluir dados do QR code
      if (paymentMethod.toUpperCase() === "PIX" && data.pix) {
        checkoutData.pix = {
          encodedImage: data.pix.encodedImage,
          payload: data.pix.payload
        };
      }

      setCheckoutData(checkoutData);
      setShowCheckout(true);
      setIsVerifyingPayment(true);

      toast({
        title: "Link de pagamento gerado!",
        description: paymentMethod.toUpperCase() === "PIX" 
          ? "Use o QR Code para efetuar o pagamento via PIX." 
          : "Você será redirecionado para a página de pagamento.",
      });

      // Redirecionar para o link de pagamento para pagamentos não-PIX
      if (paymentMethod.toUpperCase() !== "PIX" && data.payment.invoiceUrl) {
        window.location.href = data.payment.invoiceUrl;
      }
      
      return newSubscription;
    } catch (error: any) {
      console.error("Erro ao assinar plano:", error);
      toast({
        variant: "destructive",
        title: "Erro ao contratar plano",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
      });

      // Limpar dados em caso de erro
      setCheckoutData(null);
      setShowCheckout(false);
      setIsVerifyingPayment(false);
      return null;
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setIsVerifyingPayment(false);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 3000);
  };

  // This component was causing the issue - fixed JSX syntax
  const CheckoutDialog = () => {
    return (
      <Dialog open={showCheckout} onOpenChange={handleCloseCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogDescription>
              {checkoutData?.billingType === "PIX" 
                ? "Utilize o QR Code abaixo para realizar o pagamento via PIX" 
                : "Você será redirecionado para a página de pagamento"}
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
                  Valor: R$ {checkoutData.value.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Vencimento: {new Date(checkoutData.dueDate).toLocaleDateString()}
                </p>
              </div>

              {checkoutData.billingType === "PIX" && checkoutData.pix?.encodedImage && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-2 rounded-lg shadow">
                    <img 
                      src={`data:image/png;base64,${checkoutData.pix.encodedImage}`}
                      alt="QR Code PIX" 
                      className="w-52 h-52"
                    />
                  </div>
                  
                  {checkoutData.pix?.payload && (
                    <div className="w-full space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Ou copie e cole o código PIX abaixo:
                      </p>
                      <div className="flex items-center space-x-2 rounded-md border px-3 py-2 text-xs">
                        <code className="flex-1 break-all">{checkoutData.pix.payload}</code>
                        <button 
                          onClick={() => handleCopyToClipboard(checkoutData.pix?.payload || "")}
                          className="p-1 rounded-md hover:bg-muted"
                        >
                          {copiedText === checkoutData.pix.payload ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {checkoutData.invoiceUrl && checkoutData.billingType !== "PIX" && (
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
    );
  };

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog,
  };
}
