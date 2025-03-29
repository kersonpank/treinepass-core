
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, AlertTriangle, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { usePlanCancellation } from "./hooks/usePlanCancellation";
import { formatCurrency } from "@/lib/utils";

export function UserSubscriptions() {
  const { toast } = useToast();
  const {
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan
  } = usePlanCancellation();

  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const {
    data: subscriptions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["userSubscriptions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: userSubscriptions, error } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (
            id,
            name,
            description,
            price,
            features
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return userSubscriptions;
    },
  });

  const handleCancelSubscription = async (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = async () => {
    if (!selectedSubscription) return;
    
    setIsCancelling(true);
    try {
      // Cancel in our system
      const { error } = await supabase
        .from("user_plan_subscriptions")
        .update({
          status: "cancelled",
        })
        .eq("id", selectedSubscription.id);

      if (error) throw error;

      // Cancel in Asaas if there's an asaas_subscription_id
      if (selectedSubscription.asaas_subscription_id) {
        const { error: cancelError } = await supabase.functions.invoke("cancel-asaas-subscription", {
          body: {
            asaasSubscriptionId: selectedSubscription.asaas_subscription_id
          }
        });

        if (cancelError) {
          console.error("Erro ao cancelar assinatura no Asaas:", cancelError);
          toast({
            variant: "destructive",
            title: "Atenção",
            description: "Plano cancelado internamente, mas ocorreu um erro ao cancelar no Asaas.",
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Assinatura cancelada com sucesso.",
      });

      refetch();
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao cancelar assinatura",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper function to get status badge variant and label
  const getStatusBadge = (status: string, payment_status: string) => {
    let variant: "default" | "outline" | "destructive" | "secondary" = "default";
    let label = "";
    
    // Status do plano
    if (status === "active" && payment_status === "paid") {
      variant = "default"; // blue
      label = "Ativo";
    } else if (status === "active" && payment_status === "pending") {
      variant = "secondary"; // gray
      label = "Aguardando Pagamento";
    } else if (status === "pending") {
      variant = "secondary"; // gray
      label = "Pendente";
    } else if (status === "cancelled") {
      variant = "outline"; // outlined
      label = "Cancelado";
    } else if (status === "expired") {
      variant = "destructive"; // red
      label = "Expirado";
    } else if (status === "overdue") {
      variant = "destructive"; // red
      label = "Atrasado";
    } else {
      variant = "secondary";
      label = "Desconhecido";
    }
    
    return { variant, label };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="inline-block p-3 bg-secondary/30 rounded-full">
          <CreditCard className="h-8 w-8 text-secondary-foreground" />
        </div>
        <h3 className="text-lg font-medium">Nenhuma assinatura encontrada</h3>
        <p className="text-sm text-muted-foreground">
          Você ainda não possui assinaturas ativas. Escolha um plano para começar a treinar.
        </p>
      </div>
    );
  }

  const nowDate = new Date();

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => {
        const status = getStatusBadge(
          subscription.status || "",
          subscription.payment_status || ""
        );
        const isActive = subscription.status === "active" && subscription.payment_status === "paid";
        const isPending = subscription.status === "pending" || (subscription.status === "active" && subscription.payment_status === "pending");
        const isCancelled = subscription.status === "cancelled";
        const startDate = subscription.start_date ? new Date(subscription.start_date) : null;
        const endDate = subscription.end_date ? new Date(subscription.end_date) : null;

        return (
          <Card key={subscription.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-secondary/10 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">
                    {subscription.benefit_plans?.name || "Plano"}
                  </h3>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="text-xl font-bold">
                  {formatCurrency(subscription.benefit_plans?.price || 0)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mês
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data de Início</p>
                    <p>{startDate ? startDate.toLocaleDateString('pt-BR') : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data de Término</p>
                    <p>{endDate ? endDate.toLocaleDateString('pt-BR') : "Em andamento"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status do Pagamento</p>
                    <p>{subscription.payment_status === "paid" ? "Pago" : 
                       subscription.payment_status === "pending" ? "Pendente" : 
                       subscription.payment_status === "overdue" ? "Atrasado" : 
                       subscription.payment_status === "cancelled" ? "Cancelado" : 
                       subscription.payment_status || "Desconhecido"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última atualização</p>
                    <p>{new Date(subscription.updated_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {isActive && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                    <Check size={16} />
                    <span>Seu plano está ativo e você pode treinar normalmente.</span>
                  </div>
                )}

                {isPending && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    <AlertTriangle size={16} />
                    <span>Aguardando confirmação de pagamento para ativar seu plano.</span>
                  </div>
                )}

                {isCancelled && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <X size={16} />
                    <span>Esta assinatura foi cancelada.</span>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {subscription.payment_link && isPending && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(subscription.payment_link, "_blank")}
                    >
                      Realizar Pagamento
                    </Button>
                  )}
                  {isActive && !isCancelled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelSubscription(subscription)}
                    >
                      Cancelar Plano
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Não, manter assinatura
            </Button>
            <Button variant="destructive" onClick={confirmCancelSubscription} disabled={isCancelling}>
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Sim, cancelar assinatura"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
