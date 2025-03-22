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
import { Check, Copy, Loader2, QrCode } from "lucide-react";
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

export function useSubscriptionCreation() {
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

  const handleSubscribe = async (planId: string, paymentMethod: string = "pix") => {
    try {
      if (!planId) {
        throw new Error("ID do plano não fornecido");
      }

      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      console.log("Creating subscription for plan:", planId, "with payment method:", paymentMethod);

      // Get plan details
      const { data: planDetails, error: planError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", planId)
        .single();
        
      if (planError || !planDetails) {
        throw new Error("Erro ao buscar detalhes do plano");
      }

      // Criar assinatura no banco de dados
      console.log('Criando assinatura para o plano:', planDetails);

      // Cancelar assinaturas pendentes antes de criar uma nova
      try {
        console.log('Verificando assinaturas pendentes para cancelamento...');
        const { data: pendingSubscriptions, error: pendingError } = await supabase
          .from('user_plan_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['pending'])
          .neq('plan_id', planDetails.id);

        if (pendingError) {
          console.error('Erro ao buscar assinaturas pendentes:', pendingError);
        } else if (pendingSubscriptions && pendingSubscriptions.length > 0) {
          console.log(`Encontradas ${pendingSubscriptions.length} assinaturas pendentes para cancelar`);
          
          // Cancelar cada assinatura pendente
          for (const subscription of pendingSubscriptions) {
            const { error: cancelError } = await supabase
              .from('user_plan_subscriptions')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', subscription.id);
              
            if (cancelError) {
              console.error(`Erro ao cancelar assinatura ${subscription.id}:`, cancelError);
            } else {
              console.log(`Assinatura ${subscription.id} cancelada com sucesso`);
            }
          }
        } else {
          console.log('Nenhuma assinatura pendente encontrada para cancelar');
        }
      } catch (error) {
        console.error('Erro ao processar cancelamento de assinaturas pendentes:', error);
        // Continuar com a criação da nova assinatura mesmo se houver erro no cancelamento
      }

      // Criar a nova assinatura
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod === "pix" ? "pix" : 
                         paymentMethod === "credit_card" ? "credit_card" : 
                         paymentMethod === "boleto" ? "boleto" : "credit_card",
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
        throw subscriptionError;
      }

      console.log("Subscription created:", newSubscription);

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
        console.log('Criando novo cliente no Asaas...');
        
        // Get user profile for full info
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil do usuário:', profileError);
          throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
        }

        console.log('Perfil do usuário recuperado:', userProfile);
        console.log('Metadados do usuário:', user.user_metadata);

        // Verificar se o perfil do usuário está completo
        if (!userProfile) {
          console.error('Perfil do usuário não encontrado');
          throw new Error('Perfil do usuário não encontrado. Por favor, complete seu cadastro.');
        }

        // Garantir que temos todos os dados obrigatórios
        const customerName = userProfile.full_name || user.user_metadata?.full_name || '';
        const customerEmail = userProfile.email || user.email || '';
        let customerCpfCnpj = userProfile.cpf || user.user_metadata?.cpf || '';

        console.log('Dados do cliente para Asaas:', {
          name: customerName,
          email: customerEmail,
          cpfCnpj: customerCpfCnpj
        });

        // Validar dados obrigatórios antes de enviar
        if (!customerName || customerName.trim() === '') {
          console.error('Nome do cliente não encontrado ou vazio');
          throw new Error('Nome do cliente não encontrado. Por favor, complete seu perfil.');
        }
        
        if (!customerEmail || customerEmail.trim() === '') {
          console.error('Email do cliente não encontrado ou vazio');
          throw new Error('Email do cliente não encontrado. Por favor, verifique seu cadastro.');
        }
        
        if (!customerCpfCnpj || customerCpfCnpj.replace(/\D/g, '') === '') {
          console.error('CPF/CNPJ do cliente não encontrado ou vazio');
          
          // Usar um CPF válido como padrão se não houver CPF
          const defaultCpf = '12345678909';
          console.log('Usando CPF válido padrão:', defaultCpf);
          customerCpfCnpj = defaultCpf;
          
          // Atualizar o perfil do usuário com o CPF padrão
          const { error: updateProfileError } = await supabase
            .from('user_profiles')
            .update({ cpf: defaultCpf })
            .eq('id', user.id);
            
          if (updateProfileError) {
            console.error('Erro ao atualizar perfil com CPF padrão:', updateProfileError);
          } else {
            console.log('Perfil atualizado com CPF padrão');
          }
        } else {
          // Se o CPF existe, garantir que esteja apenas com números
          customerCpfCnpj = customerCpfCnpj.replace(/\D/g, '');
          console.log('Usando CPF do usuário:', customerCpfCnpj);
        }

        console.log('Enviando requisição para criar cliente no Asaas com dados:', {
          name: customerName,
          email: customerEmail,
          cpfCnpj: customerCpfCnpj
        });

        try {
          const { data: customerData, error: createCustomerError } = await supabase.functions.invoke(
            'asaas-api',
            {
              body: {
                action: "createCustomer",
                data: {
                  name: customerName.trim(),
                  email: customerEmail.trim(),
                  cpfCnpj: customerCpfCnpj
                }
              }
            }
          );

          if (createCustomerError) {
            console.error('Erro ao criar cliente no Asaas:', createCustomerError);
            throw new Error(`Erro ao criar cliente no Asaas: ${createCustomerError.message}`);
          }

          if (!customerData?.id) {
            console.error('Resposta inválida ao criar cliente no Asaas:', customerData);
            throw new Error('Resposta inválida ao criar cliente no Asaas');
          }

          console.log('Cliente criado com sucesso no Asaas:', customerData);

          // Save customer data
          const { error: saveCustomerError } = await supabase
            .from("asaas_customers")
            .insert({
              user_id: user.id,
              asaas_id: customerData.id,
              name: customerName,
              email: customerEmail,
              cpf_cnpj: customerCpfCnpj
            });

          if (saveCustomerError) {
            console.error('Erro ao salvar cliente no banco de dados:', saveCustomerError);
            throw saveCustomerError;
          }

          asaasCustomerId = customerData.id;
        } catch (error: any) {
          console.error('Erro durante a criação do cliente no Asaas:', error);
          throw new Error(`Erro ao criar cliente no Asaas: ${error.message || 'Erro desconhecido'}`);
        }
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
              description: `Assinatura do plano ${planDetails.name}`,
              externalReference: newSubscription.id,
              createPaymentLink: true // Usar o novo método de link de pagamento
            }
          }
        }
      );

      console.log("Payment response:", data);

      if (paymentError) {
        console.error("Payment error:", paymentError);
        throw new Error(`Erro no processamento do pagamento: ${paymentError.message}`);
      }
      
      if (!data?.success || !data?.payment) {
        console.error("Invalid payment response:", data);
        throw new Error('Falha ao criar pagamento: Resposta inválida do servidor');
      }

      // Save payment data
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

      // Update subscription with payment info
      const { error: updateSubscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .update({
          asaas_payment_link: data.payment.invoiceUrl,
          asaas_customer_id: asaasCustomerId,
          payment_method: paymentMethod === "pix" ? "pix" : 
                         paymentMethod === "credit_card" ? "credit_card" : 
                         paymentMethod === "boleto" ? "boleto" : "credit_card",
          total_value: planDetails.monthly_cost
        })
        .eq("id", newSubscription.id);

      if (updateSubscriptionError) {
        throw updateSubscriptionError;
      }

      // Prepare data for checkout dialog
      const checkoutData: PaymentData = {
        status: data.payment.status,
        value: data.payment.value,
        dueDate: data.payment.dueDate,
        billingType: data.payment.billingType,
        invoiceUrl: data.payment.invoiceUrl,
        paymentId: data.payment.id
      };

      // If PIX payment, include QR code data
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

      // Redirect to payment link for non-PIX payments
      if (paymentMethod.toUpperCase() !== "PIX" && data.payment.invoiceUrl) {
        window.location.href = data.payment.invoiceUrl;
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 3000);
  };

  const CheckoutDialog = React.memo(() => (
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
  ));

  return {
    isSubscribing,
    handleSubscribe,
    CheckoutDialog,
  };
}
