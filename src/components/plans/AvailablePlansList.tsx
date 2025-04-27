import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { CheckoutDialog } from "@/components/plans/checkout/CheckoutDialog";
import { Database } from '@/integrations/supabase/types';

type Plan = Database['public']['Tables']['benefit_plans']['Row'];

interface AvailablePlansListProps {
  hasBusinessAccess?: boolean;
}

export function AvailablePlansList({ hasBusinessAccess }: AvailablePlansListProps) {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('boleto');

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

  const handleSubscribeToPlan = async (plan: Plan) => {
    try {
      console.log('handleSubscribeToPlan clicked:', plan);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Você precisa estar logado para assinar um plano."
        });
        return;
      }
      // Tenta buscar perfil individual
      let { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      // Se não encontrar, tenta buscar perfil de empresa
      if (!userProfile) {
        const { data: businessProfile } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setProfileData(businessProfile);
      } else {
        setProfileData(userProfile);
      }
      // Abrir diálogo de checkout
      setSelectedPlan(plan);
      setShowCheckout(true);
    } catch (error) {
      console.error('handleSubscribeToPlan error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar a assinatura"
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
                onClick={() => handleSubscribeToPlan(plan)}
              >
                Contratar Plano
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de checkout */}
      {showCheckout && selectedPlan && (
        <CheckoutDialog
          open={showCheckout}
          onOpenChange={(open) => setShowCheckout(open)}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          planValue={
            selectedPlan.plan_type === 'corporate_subsidized'
              ? selectedPlan.final_user_cost || 0
              : selectedPlan.monthly_cost
          }
        />
      )}
    </>
  );
}
