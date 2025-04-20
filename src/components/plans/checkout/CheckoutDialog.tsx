
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  paymentMethod
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Handle initiation of checkout process
  const handleInitiate = async () => {
    try {
      setIsLoading(true);
      
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
      
      // Create a unique reference ID for this subscription
      const subscriptionId = crypto.randomUUID();
      
      console.log(`Usando checkout do Asaas para ${paymentMethod}`);
      
      // Prepare callback URLs
      const origin = window.location.origin;
      const successUrl = `${origin}/payment/success`;
      const failureUrl = `${origin}/payment/failure`;
      
      // Get user profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        throw new Error("Perfil de usuário não encontrado");
      }
      
      // Prepare customer data from user profile
      const customerData = {
        ...profile,
        name: profile.full_name,
        cpfCnpj: profile.cpf
      };
      
      // Prepare checkout data
      const checkoutData = {
        planId,
        customerData,
        planName,
        value: planValue,
        description: `Assinatura ${planName}`,
        externalReference: subscriptionId,
        callback: {
          successUrl,
          failureUrl
        },
        paymentMethod
      };
      
      console.log("Enviando dados para a Edge Function (Cartão):", checkoutData);
      
      // Call the edge function to create checkout
      const { data, error } = await supabase.functions.invoke('asaas-api', {
        body: {
          action: 'initiateCheckout',
          data: checkoutData
        }
      });
      
      if (error) {
        console.error("Erro na Edge Function (Cartão):", error);
        throw error;
      }
      
      console.log("Resposta do checkout:", data);
      
      if (data.success && data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        // Open the checkout URL in a new tab
        window.open(data.checkoutUrl, "_blank");
        
        // Create a record of this subscription
        const { error: subError } = await supabase
          .from('user_plan_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId,
            status: 'pending',
            payment_status: 'pending',
            payment_method: paymentMethod,
            asaas_payment_link: data.checkoutUrl,
            external_reference: subscriptionId
          });
          
        if (subError) {
          console.error("Erro ao salvar assinatura:", subError);
        }
        
        toast({
          title: "Checkout criado",
          description: "Você será redirecionado para a página de pagamento"
        });
      } else {
        throw new Error("Não foi possível obter o link de checkout");
      }
    } catch (error) {
      console.error("Checkout error", error);
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
                `Pagar com ${paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'PIX'}`
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
