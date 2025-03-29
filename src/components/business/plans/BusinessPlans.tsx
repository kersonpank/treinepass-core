
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useBusinessPlanSubscription } from "@/components/plans/hooks/useBusinessPlanSubscription";
import { useBusinessPlanCancellation } from "@/components/plans/hooks/useBusinessPlanCancellation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlanCard } from "@/components/plans/components/PlanCard";
import { Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ActiveSubscriptionCard } from "../subscriptions/ActiveSubscriptionCard";

export function BusinessPlans() {
  const { toast } = useToast();
  const [showPlansDialog, setShowPlansDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("pix");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { isSubscribing, handleSubscribe, CheckoutDialog } = useBusinessPlanSubscription();
  const { showCancelDialog, setShowCancelDialog, handleCancelPlan, isLoading: isCancelling } = useBusinessPlanCancellation();
  
  const { data: businessProfile } = useQuery({
    queryKey: ["businessProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["businessSubscription", businessProfile?.id],
    queryFn: async () => {
      if (!businessProfile?.id) return null;

      const { data, error } = await supabase
        .from("business_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("business_id", businessProfile.id)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!businessProfile?.id,
  });

  const { data: availablePlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["availableBusinessPlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .in("plan_type", ["corporate", "corporate_subsidized"])
        .eq("status", "active")
        .order("monthly_cost");
        
      if (error) throw error;
      return data;
    },
  });

  const handleConfirmSubscribe = async () => {
    if (!selectedPlanId) {
      toast({
        variant: "destructive", 
        title: "Erro", 
        description: "Selecione um plano para continuar"
      });
      return;
    }

    try {
      const result = await handleSubscribe(selectedPlanId, selectedPaymentMethod, businessProfile?.id);
      if (result) {
        setShowPlansDialog(false);
      }
    } catch (error) {
      console.error("Erro ao assinar plano:", error);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
      active: { label: "Ativo", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      overdue: { label: "Atrasado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" }
    };
    
    return statusMap[status] || { label: status, variant: "default" };
  };

  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
      paid: { label: "Pago", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      overdue: { label: "Atrasado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
      refunded: { label: "Reembolsado", variant: "outline" },
    };
    
    return statusMap[status] || { label: status, variant: "default" };
  };

  if (isLoadingSubscription) {
    return (
      <div className="flex justify-center my-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Planos Empresariais</h2>
        {!subscription && (
          <Button onClick={() => setShowPlansDialog(true)}>
            Contratar Plano
          </Button>
        )}
      </div>

      {/* Exibir plano ativo */}
      {subscription ? (
        <ActiveSubscriptionCard
          subscription={subscription}
          onCancel={() => setShowCancelDialog(true)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum plano ativo</CardTitle>
            <CardDescription>
              Sua empresa ainda não possui um plano ativo. Contrate um plano para oferecer benefícios aos seus colaboradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPlansDialog(true)}>
              Ver planos disponíveis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog para selecionar planos */}
      <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Planos Empresariais Disponíveis</DialogTitle>
            <DialogDescription>
              Escolha o plano ideal para sua empresa
            </DialogDescription>
          </DialogHeader>

          {isLoadingPlans ? (
            <div className="flex justify-center my-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              {availablePlans?.length === 0 ? (
                <p>Nenhum plano disponível no momento.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePlans?.map((plan) => (
                      <Card 
                        key={plan.id}
                        className={`cursor-pointer transition-all ${
                          selectedPlanId === plan.id 
                            ? "border-primary border-2" 
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{plan.name}</CardTitle>
                              <CardDescription>{plan.description}</CardDescription>
                            </div>
                            {selectedPlanId === plan.id && (
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-2xl font-bold">
                            {formatCurrency(Number(plan.monthly_cost))}
                            <span className="text-sm font-normal text-muted-foreground">/mês</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Badge variant={plan.plan_type === 'corporate' ? 'default' : 'secondary'}>
                              {plan.plan_type === 'corporate' ? 'Corporativo' : 'Corporativo Subsidiado'}
                            </Badge>
                            
                            {plan.plan_type === 'corporate_subsidized' && plan.subsidy_amount && (
                              <div className="mt-2 text-sm">
                                <p>Subsídio: {formatCurrency(plan.subsidy_amount)}</p>
                                <p>Custo para o colaborador: {formatCurrency(Number(plan.monthly_cost) - plan.subsidy_amount)}</p>
                              </div>
                            )}
                            
                            {plan.employee_limit && (
                              <p className="text-sm text-muted-foreground">
                                Limite de {plan.employee_limit} colaboradores
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedPlanId && (
                    <div className="mt-4 space-y-4">
                      <h3 className="text-lg font-medium">Forma de pagamento</h3>
                      <RadioGroup 
                        value={selectedPaymentMethod} 
                        onValueChange={setSelectedPaymentMethod}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2 border rounded p-3 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="pix" id="pix" />
                          <Label htmlFor="pix" className="flex-1 cursor-pointer">
                            PIX
                            <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded p-3 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="credit_card" id="card" />
                          <Label htmlFor="card" className="flex-1 cursor-pointer">
                            Cartão de Crédito
                            <p className="text-xs text-muted-foreground">Pagamento recorrente</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded p-3 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="boleto" id="boleto" />
                          <Label htmlFor="boleto" className="flex-1 cursor-pointer">
                            Boleto Bancário
                            <p className="text-xs text-muted-foreground">Vencimento em até 3 dias úteis</p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlansDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmSubscribe}
              disabled={!selectedPlanId || isSubscribing}
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Assinatura'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Plano</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar seu plano empresarial?
            </DialogDescription>
          </DialogHeader>
          <p>
            Ao cancelar, o acesso aos benefícios será encerrado imediatamente para todos os colaboradores.
            Esta ação não é reversível.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleCancelPlan(subscription?.id)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog para PIX */}
      <CheckoutDialog />
    </div>
  );
}
