import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlansList } from "./PlansList";
import { CreatePlanForm } from "./CreatePlanForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function PlansManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

      <PlansList onEditPlan={() => {}} />
    </div>
  );
}