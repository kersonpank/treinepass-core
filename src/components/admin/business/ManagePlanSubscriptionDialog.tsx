import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Business } from "./types/business";

interface ManagePlanSubscriptionDialogProps {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ManagePlanSubscriptionDialog({
  business,
  open,
  onOpenChange,
  onSuccess,
}: ManagePlanSubscriptionDialogProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const handleActivatePlan = async () => {
    if (!selectedPlan || !business) return;

    try {
      // Criar uma nova assinatura de plano
      const { error: subscriptionError } = await supabase
        .from("user_plan_subscriptions")
        .insert({
          user_id: business.user_id,
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
          <DialogTitle>Ativar Plano</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Empresa</label>
            <p className="text-sm text-muted-foreground">{business?.company_name}</p>
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
                    {plan.name}
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