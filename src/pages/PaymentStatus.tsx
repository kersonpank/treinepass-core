
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  // Determina se é uma página de sucesso ou falha
  const isSuccess = location.pathname.includes('success');
  
  // Extrair parâmetros da URL
  const searchParams = new URLSearchParams(location.search);
  const subscriptionId = searchParams.get('subscription');
  const isBusiness = searchParams.get('business') === 'true';
  
  useEffect(() => {
    async function fetchPaymentInfo() {
      if (!subscriptionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Buscar dados da assinatura
        const { data: subscription, error: subscriptionError } = await supabase
          .from(isBusiness ? 'business_plan_subscriptions' : 'user_plan_subscriptions')
          .select('*, plan:plan_id(*)')
          .eq('id', subscriptionId)
          .single();
          
        if (subscriptionError) throw subscriptionError;
        setSubscriptionInfo(subscription);

        // Se for sucesso, marcar como pago
        if (isSuccess) {
          // Verificar pagamento no Asaas (opcional)
          // Atualizar status da assinatura
          const { error: updateError } = await supabase
            .from(isBusiness ? 'business_plan_subscriptions' : 'user_plan_subscriptions')
            .update({ 
              payment_status: 'paid',
              status: 'active'
            })
            .eq('id', subscriptionId);
            
          if (updateError) {
            console.error("Erro ao atualizar status:", updateError);
            toast({
              title: "Atenção",
              description: "Seu pagamento foi processado, mas houve um erro ao atualizar seu status. Por favor, contate o suporte.",
              variant: "destructive"
            });
          }
        }

      } catch (error) {
        console.error("Erro ao buscar informações:", error);
        toast({
          title: "Erro ao carregar informações",
          description: "Não foi possível carregar os detalhes do pagamento",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchPaymentInfo();
  }, [subscriptionId, isSuccess, isBusiness, toast]);

  // Função para navegar para o dashboard apropriado
  const goToDashboard = () => {
    if (isBusiness) {
      navigate('/dashboard-empresa');
    } else {
      navigate('/app');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="text-green-500 h-6 w-6" />
                <span>Pagamento Processado</span>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-500 h-6 w-6" />
                <span>Pagamento não Concluído</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando informações...</p>
          ) : (
            <>
              {isSuccess ? (
                <div className="text-center space-y-2">
                  <p>O seu pagamento foi processado com sucesso!</p>
                  {subscriptionInfo && (
                    <div className="bg-muted p-4 rounded-md mt-4">
                      <p className="font-medium">Plano: {subscriptionInfo.plan?.name}</p>
                      <p>Valor: R$ {subscriptionInfo.plan?.monthly_cost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p>Parece que houve um problema com o seu pagamento.</p>
                  <p className="text-muted-foreground">
                    Você pode tentar novamente ou entrar em contato com nosso suporte.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={goToDashboard}>
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
