import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "./types/plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function AvailablePlansList() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["available-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("status", "active");

      if (error) throw error;

      return data.map(plan => ({
        ...plan,
        financing_rules: plan.financing_rules as {
          type: string;
          contribution_type: string;
          employee_contribution: number;
          company_contribution: number;
        }
      }));
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planos Disponíveis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans?.map((plan: Plan) => (
            <div key={plan.id} className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p>{plan.description}</p>
                <p>{formatCurrency(Number(plan.monthly_cost))} / {plan.period_type}</p>
              </div>
              <Button onClick={() => console.log(`Selected plan: ${plan.id}`)}>Selecionar</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
