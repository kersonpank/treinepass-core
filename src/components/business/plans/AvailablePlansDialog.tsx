
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PricingCard } from "@/components/blocks/pricing-card";
import { useToast } from "@/hooks/use-toast";

interface AvailablePlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: string;
}

export function AvailablePlansDialog({ 
  open, 
  onOpenChange,
  businessId 
}: AvailablePlansDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availablePlans } = useQuery({
    queryKey: ["availablePlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .in("plan_type", ["corporate", "corporate_subsidized"])
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const handleSubscribe = async (planId: string) => {
    if (!businessId) {
      toast({
        title: "Erro",
        description: "Perfil da empresa não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("business_plan_subscriptions")
        .insert({
          business_id: businessId,
          plan_id: planId,
          status: "active",
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano contratado com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["businessPlans"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast({
        title: "Erro",
        description: "Não foi possível contratar o plano. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Planos Disponíveis</DialogTitle>
        </DialogHeader>
        <div className="h-[80vh] overflow-y-auto">
          <div className="space-y-2 pb-4">
            {availablePlans?.map((plan) => (
              <PricingCard
                key={plan.id}
                title={plan.name}
                description={plan.description || ""}
                price={plan.monthly_cost}
                features={[
                  {
                    title: "Recursos",
                    items: Object.entries(plan.rules || {}).map(([key, value]) => 
                      `${key}: ${JSON.stringify(value)}`
                    ),
                  },
                ]}
                buttonText="Contratar Plano"
                onButtonClick={() => handleSubscribe(plan.id)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
