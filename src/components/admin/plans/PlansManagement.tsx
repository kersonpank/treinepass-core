import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlansList } from "./PlansList";
import { CreatePlanForm } from "./CreatePlanForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditPlanForm } from "./EditPlanForm";
import { PlanPreview } from "./PlanPreview";
import { Plan } from "./types/plan";

export function PlansManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };

  const handleViewPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsPreviewDialogOpen(true);
  };

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
          <DialogHeader>
            <DialogTitle>Criar Novo Plano</DialogTitle>
          </DialogHeader>
          <CreatePlanForm onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <EditPlanForm 
              plan={selectedPlan} 
              onSuccess={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Plano</DialogTitle>
          </DialogHeader>
          {selectedPlan && <PlanPreview plan={selectedPlan} />}
        </DialogContent>
      </Dialog>

      <PlansList 
        onEditPlan={handleEditPlan}
        onViewPlan={handleViewPlan}
      />
    </div>
  );
}