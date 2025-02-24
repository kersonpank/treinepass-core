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

export function AvailablePlansList() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");

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

  const handleSubscribe = async (planId: string) => {
    try {
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { data: subscription, error } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      const response = await supabase.functions.invoke('asaas-api', {
        body: {
          userId: user.id,
          planId: planId,
          paymentMethod: selectedPaymentMethod
        }
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Plano selecionado com sucesso!",
        description: "Você será redirecionado para realizar o pagamento.",
      });

      if (response.data?.subscription?.paymentLink) {
        window.location.href = response.data.subscription.paymentLink;
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao assinar plano",
        description: error.message || "Não foi possível processar sua solicitação. Tente novamente.",
      });
    } finally {
      setIsSubscribing(false);
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
                onClick={() => handleSubscribe(plan.id)}
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
  );
}
