import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AvailablePlansList() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [proratedAmount, setProratedAmount] = useState<number>(0);

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile;
    },
  });

  const { data: hasBusinessAccess } = useQuery({
    queryKey: ["businessAccess", userProfile?.cpf],
    queryFn: async () => {
      if (!userProfile?.cpf) return false;

      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('cpf', userProfile.cpf)
        .eq('status', 'active')
        .limit(1);

      return employees && employees.length > 0;
    },
    enabled: !!userProfile?.cpf,
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["availablePlans", hasBusinessAccess],
    queryFn: async () => {
      let query = supabase
        .from("benefit_plans")
        .select("*, business_profiles(company_name)")
        .eq("status", "active");

      if (!hasBusinessAccess) {
        query = query.eq("plan_type", "individual");
      } else {
        query = query.or("plan_type.eq.individual,plan_type.eq.corporate_subsidized");
      }

      const { data, error } = await query.order("monthly_cost");
      if (error) throw error;
      return data;
    },
  });

  const handlePlanChange = async (plan: any) => {
    if (!userProfile) return;

    const { data: currentSubscription } = await supabase
      .from("user_plan_subscriptions")
      .select("*, benefit_plans(*)")
      .eq("user_id", userProfile.id)
      .eq("status", "active")
      .single();

    if (currentSubscription) {
      const currentPlanCost = currentSubscription.benefit_plans.monthly_cost;
      const newPlanCost = plan.monthly_cost;

      if (newPlanCost < currentPlanCost) {
        toast({
          variant: "destructive",
          title: "Downgrade não permitido",
          description: "Você só pode mudar para planos de valor igual ou superior.",
        });
        return;
      }

      const { data: proration } = await supabase.rpc('calculate_plan_proration', {
        current_plan_id: currentSubscription.plan_id,
        new_plan_id: plan.id,
        current_subscription_id: currentSubscription.id
      });

      setProratedAmount(proration?.[0]?.prorated_amount || 0);
      setSelectedPlan(plan);
      setShowUpgradeDialog(true);
      return;
    }

    handleSubscribe(plan.id);
  };

  const handleCancelPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_plan_subscriptions")
        .update({
          status: "cancelled",
        })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      toast({
        title: "Plano cancelado com sucesso",
        description: "O cancelamento será efetivado no próximo ciclo de cobrança.",
      });
      
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error canceling plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar plano",
        description: error.message,
      });
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedPlan) return;

    try {
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: currentSubscription } = await supabase
        .from("user_plan_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (!currentSubscription) throw new Error("No active subscription found");

      const { data: newSubscription, error } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          start_date: new Date().toISOString(),
          status: "pending",
          upgrade_from_subscription_id: currentSubscription.id,
          proration_credit: proratedAmount
        })
        .select()
        .single();

      if (error) throw error;

      const response = await supabase.functions.invoke('asaas-api', {
        body: {
          userId: user.id,
          planId: selectedPlan.id,
          paymentMethod: selectedPaymentMethod,
          proratedAmount: proratedAmount,
          upgradeFromSubscriptionId: currentSubscription.id
        }
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Upgrade de plano realizado!",
        description: "Você será redirecionado para realizar o pagamento.",
      });

      if (response.data?.subscription?.paymentLink) {
        window.location.href = response.data.subscription.paymentLink;
      }
    } catch (error: any) {
      console.error("Error upgrading plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao realizar upgrade",
        description: error.message,
      });
    } finally {
      setIsSubscribing(false);
      setShowUpgradeDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(plan.plan_type === 'corporate_subsidized' ? plan.final_user_cost : plan.monthly_cost)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </span>
              </CardTitle>
              {plan.plan_type === 'corporate_subsidized' && plan.business_profiles?.company_name && (
                <div className="text-sm text-muted-foreground">
                  Plano subsidiado por {plan.business_profiles.company_name}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Benefícios inclusos:</h4>
                <ul className="space-y-2 text-sm">
                  {Object.entries(plan.rules || {}).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="ml-1">{JSON.stringify(value)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  className="w-full" 
                  onClick={() => handlePlanChange(plan)}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Contratar Plano'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Upgrade de Plano</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está mudando para o plano {selectedPlan?.name}.
              </p>
              <p className="font-medium">
                Valor proporcional a ser pago: {formatCurrency(proratedAmount)}
              </p>
              <p className="text-sm text-muted-foreground">
                O valor é calculado considerando os dias restantes do mês atual.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleUpgradePlan} disabled={isSubscribing}>
              {isSubscribing ? "Processando..." : "Confirmar Upgrade"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Seu plano será cancelado no próximo ciclo de cobrança.
              Até lá, você continuará tendo acesso a todos os benefícios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Plano</AlertDialogCancel>
            <Button variant="destructive" onClick={handleCancelPlan}>
              Confirmar Cancelamento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
