
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AvailablePlansList() {
  const { toast } = useToast();

  // Buscar dados do usuário atual
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar planos corporativos disponíveis baseado no CPF do usuário
  const { data: corporatePlans } = useQuery({
    queryKey: ["corporatePlans", currentUser?.cpf, currentUser?.birth_date],
    enabled: !!currentUser?.cpf && !!currentUser?.birth_date,
    queryFn: async () => {
      if (!currentUser?.cpf || !currentUser?.birth_date) return [];

      // Buscar informações do funcionário e seus planos disponíveis
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select(`
          *,
          business_profiles!inner (
            company_name
          ),
          employee_benefits!inner (
            plan_id,
            status,
            benefit_plans (
              *
            )
          )
        `)
        .eq("cpf", currentUser.cpf)
        .eq("birth_date", currentUser.birth_date)
        .eq("status", "active");

      if (employeesError) throw employeesError;
      
      console.log("Planos corporativos encontrados:", employees);
      return employees || [];
    },
  });

  // Buscar planos individuais disponíveis
  const { data: individualPlans, isLoading } = useQuery({
    queryKey: ["individualPlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("plan_type", "individual")
        .eq("status", "active")
        .order("monthly_cost");

      if (error) throw error;
      return data;
    },
  });

  const handleSubscribe = async (planId: string, isFullySubsidized: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para assinar um plano",
        });
        return;
      }

      // Verificar se já existe um plano ativo
      const { data: existingPlan } = await supabase
        .from("user_plan_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (existingPlan) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você já possui um plano ativo. Cancele o plano atual antes de ativar um novo.",
        });
        return;
      }

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
          status: isFullySubsidized ? "active" : "pending"
        });

      if (error) throw error;

      toast({
        title: isFullySubsidized ? "Plano ativado com sucesso!" : "Plano contratado com sucesso!",
        description: isFullySubsidized 
          ? "Você já pode começar a usar seu plano."
          : "Em breve você receberá as instruções de pagamento.",
      });
    } catch (error: any) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao ativar plano",
        description: error.message,
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
    <div className="space-y-6">
      {corporatePlans && corporatePlans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Planos Empresariais Disponíveis</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {corporatePlans.map((employee) => (
              employee.employee_benefits.map((benefit) => {
                const plan = benefit.benefit_plans;
                const isFullySubsidized = plan.financing_rules.type === "company_paid" || 
                  (plan.financing_rules.type === "co_financed" && plan.financing_rules.employee_contribution === 0);
                
                const employeeCost = plan.financing_rules.type === "co_financed"
                  ? plan.financing_rules.contribution_type === "fixed"
                    ? plan.financing_rules.employee_contribution
                    : (plan.monthly_cost * plan.financing_rules.employee_contribution) / 100
                  : 0;

                return (
                  <Card key={benefit.plan_id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{plan.name}</span>
                        <span className="text-2xl font-bold">
                          {formatCurrency(employeeCost)}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Oferecido por {employee.business_profiles.company_name}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Benefícios inclusos:</h4>
                        <ul className="space-y-2 text-sm">
                          {Object.entries(plan.rules || {}).map(([key, value]) => (
                            <li key={key} className="flex items-center text-muted-foreground">
                              • {key}: {JSON.stringify(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleSubscribe(benefit.plan_id, isFullySubsidized)}
                      >
                        {isFullySubsidized ? "Ativar Plano" : "Contratar Plano"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Planos Individuais</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {individualPlans?.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(plan.monthly_cost)}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Benefícios inclusos:</h4>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(plan.rules || {}).map(([key, value]) => (
                      <li key={key} className="flex items-center text-muted-foreground">
                        • {key}: {JSON.stringify(value)}
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
      </div>
    </div>
  );
}
