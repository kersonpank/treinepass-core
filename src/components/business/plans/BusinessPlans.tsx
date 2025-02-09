
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PlanCard } from "./PlanCard";
import { AvailablePlansDialog } from "./AvailablePlansDialog";
import { useToast } from "@/hooks/use-toast";

export function BusinessPlans() {
  const [showPlansDialog, setShowPlansDialog] = useState(false);
  const { toast } = useToast();

  const { data: businessProfile } = useQuery({
    queryKey: ["businessProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: activePlans, isLoading } = useQuery({
    queryKey: ["businessPlans", businessProfile?.id],
    queryFn: async () => {
      if (!businessProfile?.id) return [];

      const { data, error } = await supabase
        .from("business_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("business_id", businessProfile.id)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!businessProfile?.id,
  });

  if (isLoading) {
    return <div>Carregando planos...</div>;
  }

  if (!activePlans?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-xl font-semibold">Nenhum plano ativo</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Sua empresa ainda não possui nenhum plano ativo. 
          Clique no botão abaixo para ver os planos disponíveis.
        </p>
        <Button onClick={() => setShowPlansDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Plano
        </Button>
        <AvailablePlansDialog 
          open={showPlansDialog} 
          onOpenChange={setShowPlansDialog}
          businessId={businessProfile?.id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planos Ativos</h2>
        <Button onClick={() => setShowPlansDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Plano
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activePlans.map((subscription) => (
          <PlanCard 
            key={subscription.id}
            plan={subscription.benefit_plans}
            subscription={subscription}
          />
        ))}
      </div>

      <AvailablePlansDialog 
        open={showPlansDialog} 
        onOpenChange={setShowPlansDialog}
        businessId={businessProfile?.id}
      />
    </div>
  );
}
