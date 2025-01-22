import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlansList } from "./PlansList";
import { CreatePlanForm } from "./CreatePlanForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plan } from "./types/plan";

export function PlansManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Ensure the returned data matches the Plan type
      return data.map((plan): Plan => ({
        ...plan,
        plan_type: plan.plan_type as Plan["plan_type"],
        period_type: plan.period_type as Plan["period_type"],
      }));
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planos</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <CreatePlanForm onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {plans && <PlansList plans={plans} />}
    </div>
  );
}