import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function AvailablePlansList() {
  const { toast } = useToast();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["availablePlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*, business_profiles(company_name)")
        .eq("status", "active")
        .or("plan_type.eq.individual,plan_type.eq.corporate_subsidized")
        .order("monthly_cost");

      if (error) throw error;
      return data;
    },
  });

  const handleSubscribe = async (planId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { error } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Plano selecionado com sucesso!",
        description: "Aguarde a confirmação do pagamento para ativar seu plano.",
      });
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao assinar plano",
        description: "Não foi possível processar sua solicitação. Tente novamente.",
      });
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
            {plan.plan_type === 'corporate_subsidized' && (
              <div className="text-sm text-muted-foreground">
                Plano subsidiado por {plan.business_profiles?.company_name}
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

            <Button 
              className="w-full" 
              onClick={() => handleSubscribe(plan.id)}
            >
              Contratar Plano
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}