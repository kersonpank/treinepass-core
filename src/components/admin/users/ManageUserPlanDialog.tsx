
import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "./types/user";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
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

  const { data: activePlan, isLoading: isLoadingActivePlan } = useQuery({
    queryKey: ["activePlan", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleActivatePlan = async () => {
    if (!selectedPlan || !user) return;

    try {
      setIsSubmitting(true);

      // Se existe um plano ativo, desativa-o primeiro
      if (activePlan) {
        const { error: deactivationError } = await supabase
          .from("user_plan_subscriptions")
          .update({ 
            status: "cancelled",
            end_date: new Date().toISOString()
          })
          .eq("id", activePlan.id);

        if (deactivationError) throw deactivationError;
      }

      // Cria a nova assinatura
      const { error: newSubscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: selectedPlan,
          start_date: new Date().toISOString(),
          status: "active",
        });

      if (newSubscriptionError) throw newSubscriptionError;

      // Atualiza o status do usuário
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ active: true })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast({
        title: "Sucesso",
        description: activePlan 
          ? "Plano alterado com sucesso" 
          : "Plano ativado com sucesso",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingPlans || isLoadingActivePlan;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Plano do Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Usuário</label>
            <p className="text-sm text-muted-foreground">{user?.full_name || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || 'N/A'}</p>
          </div>

          {activePlan && (
            <div className="p-4 border rounded-lg bg-muted">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Plano Atual</span>
                <Badge>{activePlan.status}</Badge>
              </div>
              <p className="text-sm">{activePlan.benefit_plans.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(activePlan.benefit_plans.monthly_cost)}
              </p>
              <p className="text-xs text-muted-foreground">
                Início: {new Date(activePlan.start_date).toLocaleDateString()}
              </p>
              {activePlan.end_date && (
                <p className="text-xs text-muted-foreground">
                  Término: {new Date(activePlan.end_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {activePlan ? "Selecione o Novo Plano" : "Selecione o Plano"}
            </label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({formatCurrency(plan.monthly_cost)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleActivatePlan} 
              disabled={!selectedPlan || isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : activePlan ? (
                "Alterar Plano"
              ) : (
                "Ativar Plano"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
