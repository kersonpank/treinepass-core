
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CardTitle, CardDescription, CardHeader, CardContent, Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  
  // Determine if success or failure based on URL
  const isSuccess = window.location.pathname.includes("success");
  
  // Subscription ID from URL
  const subscriptionId = searchParams.get("subscription");

  useEffect(() => {
    const updateSubscriptionStatus = async () => {
      if (!subscriptionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch subscription data
        const { data, error } = await supabase
          .from("user_plan_subscriptions")
          .select("*, plan:plan_id(*)")
          .eq("id", subscriptionId)
          .single();
        
        if (error) throw error;
        setSubscriptionData(data);
        
        // If success page, update subscription status
        if (isSuccess) {
          await supabase
            .from("user_plan_subscriptions")
            .update({ 
              payment_status: "paid",
              status: "active",
              last_payment_date: new Date().toISOString()
            })
            .eq("id", subscriptionId);
          
          toast({
            title: "Pagamento confirmado",
            description: "Sua assinatura está ativa."
          });
        }
      } catch (error: any) {
        console.error("Erro ao atualizar status:", error);
        toast({
          variant: "destructive",
          title: "Erro ao processar pagamento",
          description: error.message || "Ocorreu um erro ao processar o pagamento."
        });
      } finally {
        setLoading(false);
      }
    };
    
    updateSubscriptionStatus();
  }, [subscriptionId, isSuccess, toast]);

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            {loading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            ) : isSuccess ? (
              <CheckCircle className="h-10 w-10 text-green-500" />
            ) : (
              <AlertCircle className="h-10 w-10 text-red-500" />
            )}
          </div>
          <CardTitle className="text-center">
            {loading ? "Processando pagamento..." : (
              isSuccess ? "Pagamento confirmado" : "Pagamento não concluído"
            )}
          </CardTitle>
          <CardDescription className="text-center">
            {loading ? "Aguarde enquanto confirmamos seu pagamento" : (
              isSuccess ? 
                "Sua assinatura foi processada com sucesso" : 
                "Houve um problema com o processamento do seu pagamento"
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!loading && subscriptionData && (
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium">Plano: {subscriptionData.plan?.name}</p>
              <p>Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscriptionData.monthly_cost)}</p>
              {isSuccess && <p>Status: Ativo</p>}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={() => navigate("/app")} className="w-full">
            Ir para o dashboard
          </Button>
          
          {!isSuccess && !loading && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (subscriptionData?.asaas_payment_link) {
                  window.location.href = subscriptionData.asaas_payment_link;
                } else {
                  navigate("/app");
                }
              }} 
              className="w-full"
            >
              {subscriptionData?.asaas_payment_link ? "Tentar pagamento novamente" : "Ver planos disponíveis"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
