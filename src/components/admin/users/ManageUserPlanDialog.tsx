
import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "./types/user";

interface ManageUserPlanDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ManageUserPlanDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ManageUserPlanDialogProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const { data: plans } = useQuery({
    queryKey: ["individualPlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("plan_type", "individual")
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const handleActivatePlan = async () => {
    if (!selectedPlan || !user) return;

    try {
      const { error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: selectedPlan,
          start_date: new Date().toISOString(),
          status: "active",
        });

      if (subscriptionError) throw subscriptionError;

      toast({
        title: "Sucesso",
        description: "Plano ativado com sucesso",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ativar Plano para Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Usuário</label>
            <p className="text-sm text-muted-foreground">{user?.full_name}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Plano</label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} (Individual)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleActivatePlan} disabled={!selectedPlan}>
              Ativar Plano
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
