
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Business } from "./types/business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        .in("plan_type", ["corporate", "corporate_subsidized"])
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const { data: currentSubscriptions } = useQuery({
    queryKey: ["businessSubscriptions", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("business_id", business?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleActivatePlan = async () => {
    if (!selectedPlan || !business) return;

    try {
      const { error: subscriptionError } = await supabase
        .from("business_plan_subscriptions")
        .insert({
          business_id: business.id,
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Planos - {business?.company_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Planos Ativos */}
          {currentSubscriptions && currentSubscriptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Planos Ativos</h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  {currentSubscriptions.map((subscription) => (
                    <Card key={subscription.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{subscription.benefit_plans.name}</CardTitle>
                            <CardDescription>
                              {subscription.benefit_plans.description}
                            </CardDescription>
                          </div>
                          <Badge>{subscription.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Valor Mensal</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(Number(subscription.benefit_plans.monthly_cost))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Data de Início</p>
                            <p>{new Date(subscription.start_date).toLocaleDateString()}</p>
                            {subscription.end_date && (
                              <>
                                <p className="text-sm font-medium mt-2">Data de Término</p>
                                <p>{new Date(subscription.end_date).toLocaleDateString()}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Adicionar Novo Plano */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Adicionar Novo Plano</h3>
            <div className="space-y-4">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({formatCurrency(Number(plan.monthly_cost))}/mês)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPlan && plans && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Plano Selecionado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {plans.find(p => p.id === selectedPlan)?.description && (
                        <p className="text-sm text-muted-foreground">
                          {plans.find(p => p.id === selectedPlan)?.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Valor Mensal</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(Number(plans.find(p => p.id === selectedPlan)?.monthly_cost))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Tipo de Plano</p>
                          <p>{plans.find(p => p.id === selectedPlan)?.plan_type === 'corporate' ? 'Corporativo' : 'Corporativo Subsidiado'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
