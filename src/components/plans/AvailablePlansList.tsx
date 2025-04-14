
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useSubscriptionCreation } from "./hooks/useSubscriptionCreation";
import { Database } from '@/integrations/supabase/types';

type Plan = Database['public']['Tables']['benefit_plans']['Row'];

interface AvailablePlansListProps {
  hasBusinessAccess?: boolean;
}

export function AvailablePlansList({ hasBusinessAccess }: AvailablePlansListProps) {
  const { toast } = useToast();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("undefined");
  const { isSubscribing, handleSubscribe, CheckoutDialog } = useSubscriptionCreation();

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

  const handleSubscribeToPlan = async (planId: string) => {
    try {
      await handleSubscribe(planId, selectedPaymentMethod);
    } catch (error) {
      console.error("Error subscribing to plan:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Filter out subsidized plans if user doesn't have business access
  const filteredPlans = hasBusinessAccess 
    ? plans 
    : plans?.filter(plan => plan.plan_type !== 'corporate_subsidized');

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans?.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(plan.plan_type === 'corporate_subsidized' ? plan.final_user_cost || 0 : plan.monthly_cost)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </span>
              </CardTitle>
              {plan.plan_type === 'corporate_subsidized' && plan.business_profiles?.company_name && (
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
                onClick={() => handleSubscribeToPlan(plan.id)}
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Processando...' : 'Contratar Plano'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <CheckoutDialog />
    </>
  );
}
