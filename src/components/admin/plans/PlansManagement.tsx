
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlansList } from "./PlansList";
import { CreatePlanForm } from "./CreatePlanForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function PlansManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from("benefit_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Plano excluído",
        description: "O plano foi excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir plano",
        description: error.message,
      });
    },
  });

  const handleCreatePlanSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["plans"] });
    toast({
      title: "Plano criado",
      description: "O plano foi criado com sucesso",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planos</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo plano
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <PlansList
          plans={plans || []}
          onPlanDelete={(planId) => deletePlanMutation.mutate(planId)}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["plans"] })}
        />
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Criar novo plano</DialogTitle>
          </DialogHeader>
          <CreatePlanForm onSuccess={handleCreatePlanSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
