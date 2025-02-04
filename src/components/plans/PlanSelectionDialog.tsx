import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PlanSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function PlanSelectionDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: PlanSelectionDialogProps) {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["availablePlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("status", "active")
        .order("price");

      if (error) throw error;
      return data;
    },
  });

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;

    setIsSubscribing(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 dias de plano

      const { error } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan_id: selectedPlanId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        payment_status: "paid", // Em produção, isso seria definido após confirmação do pagamento
      });

      if (error) throw error;

      toast({
        title: "Plano ativado com sucesso!",
        description: "Você já pode começar a usar seu plano.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao ativar plano",
        description: "Não foi possível ativar o plano. Tente novamente.",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Escolha seu plano</DialogTitle>
          <DialogDescription>
            Selecione um plano para começar a treinar
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans?.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlanId === plan.id
                    ? "border-primary ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    R$ {Number(plan.price).toFixed(2)}/mês
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={selectedPlanId === plan.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    {selectedPlanId === plan.id ? "Selecionado" : "Selecionar"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={!selectedPlanId || isSubscribing}
          >
            {isSubscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ativando plano...
              </>
            ) : (
              "Ativar plano"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
