import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlansList } from "./PlansList";
import { CreatePlanForm } from "./CreatePlanForm";
import { EditPlanForm } from "./EditPlanForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function PlansManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: selectedPlan } = useQuery({
    queryKey: ["plan", selectedPlanId],
    queryFn: async () => {
      if (!selectedPlanId) return null;
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("id", selectedPlanId)
        .single();

      if (error) throw error;
      
      if (!data) return null;

      // Ensure plan_type is one of the allowed values
      const validPlanTypes = ["corporate", "individual", "corporate_subsidized"] as const;
      const planType = validPlanTypes.includes(data.plan_type as any) 
        ? data.plan_type as "corporate" | "individual" | "corporate_subsidized"
        : "corporate";

      // Convert monthly_cost to string and ensure proper typing
      return {
        ...data,
        monthly_cost: data.monthly_cost.toString(),
        plan_type: planType,
      };
    },
    enabled: !!selectedPlanId,
  });

  const handleEditPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Planos</h2>
          <p className="text-muted-foreground">
            Gerencie os planos disponíveis no sistema
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Plano</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para criar um novo plano no sistema.
              </DialogDescription>
            </DialogHeader>
            <CreatePlanForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Plano</DialogTitle>
              <DialogDescription>
                Atualize as informações do plano selecionado.
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <EditPlanForm 
                plan={selectedPlan} 
                onSuccess={() => setIsEditDialogOpen(false)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <PlansList onEditPlan={handleEditPlan} />
    </div>
  );
}