
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PixInfo } from "./PixInfo";
import { BoletoInfo } from "./BoletoInfo";
import { CreditCardForm } from "./CreditCardForm";
import { useSimplifiedPayment } from "@/hooks/useSimplifiedPayment";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  planValue: number;
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function CheckoutDialog({
  open,
  onOpenChange,
  planId,
  planName,
  planValue
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { createPayment, prepareCustomerDataFromProfile } = useSimplifiedPayment();
  
  // Função para processar pagamento com cartão de crédito
  const handleCreditCardSubmit = async (formData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para continuar."
        });
        return;
      }
      
      // Get user profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        throw new Error("Perfil de usuário não encontrado");
      }
      
      // Create a unique reference ID for this subscription
      const subscriptionId = crypto.randomUUID();
      
      console.log(`Iniciando pagamento com cartão para: ${planName}`);
      
      // Preparar dados do cartão
      const cardData = {
        holderName: formData.holderName,
        number: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        cvv: formData.cvv
      };
      
      // Preparar dados do titular do cartão
      const holderInfo = {
        name: profile.full_name || formData.holderName,
        email: profile.email,
        cpfCnpj: profile.cpf || '12345678909',
        postalCode: '01310930', // CEP válido padrão
        addressNumber: '1000', // Número padrão
        phone: profile.phone || profile.phone_number || ''
      };
      
      // Preparar payload para processamento do cartão
      const payload = {
        customerData: {
          name: profile.full_name || 'Cliente',
          email: profile.email,
          cpfCnpj: profile.cpf || '12345678909',
          mobilePhone: profile.phone
        },
        paymentData: {
          description: `Assinatura ${planName}`,
          value: planValue || 0,
          externalReference: subscriptionId
        },
        creditCard: cardData,
        creditCardHolderInfo: holderInfo
      };
      
      console.log("Enviando dados para processamento de cartão:", JSON.stringify(payload, null, 2));
      
      // Chamar a Edge Function para processar o pagamento
      const { data, error } = await supabase.functions.invoke('asaas-api', {
        body: {
          action: 'processCreditCard',
          data: payload
        }
      });
      
      if (error) {
        console.error("Erro na Edge Function:", error);
        throw error;
      }
      
      console.log("Resposta do processamento de cartão:", data);
      
      if (data.success) {
        // Armazenar dados de pagamento para exibir na UI
        setPaymentData(data);
        setShowPaymentDetails(true);
        
        // Mapear o método de pagamento para os valores aceitos pelo banco de dados
        const dbPaymentMethod = 'credit_card';
        
        // Criar registro da assinatura
        const { error: subError } = await supabase
          .from('user_plan_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId,
            status: 'pending',
            payment_method: dbPaymentMethod,
            payment_status: 'pending',
            asaas_payment_id: data.id,
            start_date: new Date().toISOString()
          });
        
        if (subError) {
          console.error("Erro ao salvar assinatura:", subError);
        }
        
        toast({
          title: "Pagamento processado",
          description: "Seu pagamento está sendo processado. Aguarde a confirmação."
        });
      } else {
        throw new Error(data.message || "Não foi possível processar o pagamento");
      }
    } catch (error) {
      console.error("Erro no pagamento com cartão:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento");
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle initiation of checkout process
  const handleInitiate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para continuar."
        });
        return;
      }
      
      // Get user profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        throw new Error("Perfil de usuário não encontrado");
      }
      
      // Create a unique reference ID for this subscription
      const subscriptionId = crypto.randomUUID();
      
      console.log(`Iniciando checkout do Asaas para método de pagamento: ${paymentMethod}`);
      
      // Prepare callback URLs
      const origin = window.location.origin;
      const successUrl = `${origin}/payment/success`;
      const failureUrl = `${origin}/payment/failure`;
      
      // Prepare customer data from user profile
      const customerData = {
        name: profile.full_name,
        cpfCnpj: profile.cpf,
        email: profile.email,
        phone: profile.phone
      };
      
      // Prepare checkout data
      const checkoutData = {
        planId,
        customerData,
        planName,
        value: planValue || 0, // Handle undefined planValue
        description: `Assinatura ${planName}`,
        externalReference: subscriptionId,
        callback: {
          successUrl,
          failureUrl
        },
        paymentMethod
      };
      
      console.log("Enviando dados para a Edge Function:", JSON.stringify(checkoutData, null, 2));
      
      // Verificar se o usuário já tem um ID de cliente Asaas
      const asaasCustomerId = profile.asaas_customer_id;
      console.log("ID do cliente Asaas encontrado no perfil:", asaasCustomerId);
      
      // Preparar dados para o SDK integrado
      const sdkCheckoutData = {
        // Se já temos o ID do cliente, não precisamos enviar os dados completos
        customerData: asaasCustomerId ? {
          id: asaasCustomerId,
          name: profile.full_name || 'Cliente',
          cpfCnpj: profile.cpf || '12345678909'
        } : {
          name: profile.full_name || 'Cliente',
          email: profile.email,
          cpfCnpj: profile.cpf || '12345678909', // Usar CPF padrão válido se não tiver
          mobilePhone: profile.phone,
          // Note: usando CEP válido padrão já que postal_code não existe no perfil
          postalCode: '01310930'
        },
        paymentData: {
          description: `Assinatura ${planName}`,
          value: planValue || 0,
          externalReference: subscriptionId,
          dueDateLimitDays: 7
        },
        config: {
          billingTypes: [
            paymentMethod === 'credit_card' ? 'CREDIT_CARD' : 
            paymentMethod === 'pix' ? 'PIX' : 'BOLETO'
          ],
          callbackUrl: successUrl
        }
      };
      
      console.log("Enviando dados para SDK integrado:", JSON.stringify(sdkCheckoutData, null, 2));
      
      // Call the edge function with SDK integration
      const { data, error } = await supabase.functions.invoke('asaas-api', {
        body: {
          action: 'sdkIntegratedCheckout',
          data: sdkCheckoutData
        }
      });
      
      if (error) {
        console.error("Erro na Edge Function:", error);
        throw error;
      }
      
      console.log("Resposta do checkout SDK:", data);
      
      if (data.success) {
        // Armazenar dados de pagamento para exibir na UI de checkout transparente
        setPaymentData(data);
        setShowPaymentDetails(true);
        
        // Armazenar URL de checkout apenas para referência (não vamos redirecionar)
        if (data.paymentLink) {
          setCheckoutUrl(data.paymentLink);
        }
        
        // Se recebemos um ID de cliente Asaas e o perfil ainda não tem, atualizar o perfil
        if (data.customerId && !profile.asaas_customer_id) {
          console.log("Atualizando perfil com ID do cliente Asaas:", data.customerId);
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ asaas_customer_id: data.customerId })
            .eq('id', user.id);
          
          if (updateError) {
            console.error("Erro ao atualizar perfil com ID do cliente Asaas:", updateError);
          } else {
            console.log("Perfil atualizado com sucesso com ID do cliente Asaas");
          }
        }
      
        // Mapear o método de pagamento para os valores aceitos pelo banco de dados
        const dbPaymentMethod = 
          paymentMethod === 'credit_card' ? 'credit_card' : 
          paymentMethod === 'pix' ? 'pix' : 'boleto';
        
        // Create a record of this subscription - vamos usar apenas os campos que sabemos existir na tabela
        // Baseado nas memórias do sistema
        const { error: subError } = await supabase
          .from('user_plan_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId,
            status: 'pending',
            payment_method: dbPaymentMethod,
            payment_status: 'pending',
            asaas_payment_link: data.paymentLink,
            start_date: new Date().toISOString()
          });
        
        // Se falhar na inserção principal, tentar uma alternativa com menos campos
        if (subError) {
          console.error("Erro ao salvar assinatura:", subError);
          console.log("Tentando inserção alternativa com menos campos...");
          
          const { error: altError } = await supabase
            .from('user_plan_subscriptions')
            .insert({
              user_id: user.id,
              plan_id: planId,
              status: 'pending',
              start_date: new Date().toISOString()
            });
            
          if (altError) {
            console.error("Erro na inserção alternativa:", altError);
          }
        }
        
        toast({
          title: "Checkout criado",
          description: "Você será redirecionado para a página de pagamento"
        });
      } else {
        throw new Error(data.message || "Não foi possível obter o link de checkout");
      }
    } catch (error) {
      console.error("Checkout error", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento");
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout {planName}</DialogTitle>
          <DialogDescription>
            Valor: R$ {typeof planValue === 'number' ? planValue.toFixed(2).replace(".", ",") : '0,00'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          {/* Tabs para seleção de método de pagamento */}
          <Tabs value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as any)} className="w-full">
            <TabsList className="w-full mb-2">
              <TabsTrigger value="pix" className="flex-1">PIX</TabsTrigger>
              <TabsTrigger value="credit_card" className="flex-1">Cartão</TabsTrigger>
              <TabsTrigger value="boleto" className="flex-1">Boleto</TabsTrigger>
            </TabsList>
            <TabsContent value="pix">
  <div className="text-sm text-muted-foreground mb-2">Pagamento instantâneo via QR Code ou copia e cola.</div>
  {showPaymentDetails && paymentData ? (
    <PixInfo
      qrCode={paymentData.qrCodeImage || paymentData.qrCodeUrl || ''}
      code={paymentData.pixCode || paymentData.code || ''}
      value={paymentData.value || planValue}
      onCopy={() => {
        if (paymentData.pixCode || paymentData.code) {
          navigator.clipboard.writeText(paymentData.pixCode || paymentData.code);
          toast({ title: "Código copiado!", description: "Cole o código no seu app bancário." });
        }
      }}
    />
  ) : (
    <Button onClick={handleInitiate} disabled={isLoading || showPaymentDetails}>
      {isLoading ? 'Processando...' : 'Gerar QR Code PIX'}
    </Button>
  )}
</TabsContent>
            <TabsContent value="credit_card">
  <div className="text-sm text-muted-foreground mb-2">Preencha os dados do seu cartão para pagamento recorrente.</div>
  {showPaymentDetails && paymentData ? (
    <div className="flex flex-col items-center gap-4">
      <p className="text-green-700 font-semibold">Pagamento iniciado. Aguarde confirmação!</p>
      <a
        href={paymentData.paymentLink || paymentData.checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-block rounded bg-white border border-gray-300 px-4 py-2 text-center font-medium text-primary hover:bg-gray-50"
        style={{ textDecoration: 'none' }}
      >
        Acompanhar pagamento
      </a>
    </div>
  ) : (
    <CreditCardForm
      planName={planName}
      planPrice={planValue}
      processing={isLoading}
      onSubmit={handleCreditCardSubmit}
      onCancel={() => {}}
    />
  )}
</TabsContent>
            <TabsContent value="boleto">
  <div className="text-sm text-muted-foreground mb-2">Receba um boleto bancário para pagamento.</div>
  {showPaymentDetails && paymentData ? (
    <BoletoInfo
      digitableLine={paymentData.digitableLine || paymentData.linhaDigitavel || ''}
      boletoUrl={paymentData.invoiceUrl || paymentData.paymentLink || paymentData.checkoutUrl || ''}
      value={paymentData.value || planValue}
      onCopy={() => {
        if (paymentData.digitableLine || paymentData.linhaDigitavel) {
          navigator.clipboard.writeText(paymentData.digitableLine || paymentData.linhaDigitavel);
          toast({ title: "Linha digitável copiada!", description: "Cole a linha digitável no seu internet banking." });
        }
      }}
    />
  ) : (
    <Button onClick={handleInitiate} disabled={isLoading || showPaymentDetails}>
      {isLoading ? 'Processando...' : 'Gerar Boleto'}
    </Button>
  )}
</TabsContent>
          </Tabs>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {checkoutUrl ? (
            <div className="flex flex-col gap-4">
              <p className="text-center text-sm text-muted-foreground">
                O checkout foi aberto em uma nova janela. Se não abriu automaticamente, clique no botão abaixo.
              </p>
              <Button onClick={() => window.open(checkoutUrl, "_blank")}> 
                Abrir checkout
              </Button>
            </div>
          ) : (
            <Button onClick={handleInitiate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar com ${paymentMethod === 'credit_card' ? 'Cartão de Crédito' : paymentMethod === 'pix' ? 'PIX' : 'Boleto'}`
              )}
            </Button>
          )}

          <div className="text-xs text-center text-muted-foreground">
            Você será redirecionado para a plataforma segura do Asaas para concluir o pagamento.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
