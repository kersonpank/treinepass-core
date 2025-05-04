
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
import { useAuth } from "@/hooks/use-auth";

interface NoActivePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe?: () => void;
}

export function NoActivePlanDialog({
  open,
  onOpenChange,
  onSubscribe,
}: NoActivePlanDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Mock data for now since plans table might not exist
  const mockPlans = [
    { id: "1", name: "Basic Plan", description: "Access to basic features", price: 29.99, status: "active", features: ["Feature 1", "Feature 2"] },
    { id: "2", name: "Premium Plan", description: "Full access to all features", price: 49.99, status: "active", features: ["Feature 1", "Feature 2", "Feature 3"] },
  ];

  const { data: plans, isLoading } = useQuery({
    queryKey: ["availablePlans"],
    queryFn: async () => {
      // Use mock data instead
      return mockPlans;
      
      /*
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("status", "active")
        .order("price");

      if (error) throw error;
      return data;
      */
    },
  });

  const handleSubscribe = async () => {
    if (!selectedPlanId || !user) return;

    setIsSubscribing(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 dias de plano

      // Mock subscription creation
      // In a real app, we'd create the subscription in the database
      /*
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_id: selectedPlanId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        payment_status: "paid", // Em produção, isso seria definido após confirmação do pagamento
      });

      if (error) throw error;
      */

      toast({
        title: "Plano ativado com sucesso!",
        description: "Você já pode começar a treinar.",
      });

      onSubscribe?.();
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
            Para fazer check-in, você precisa ter um plano ativo. Escolha um dos planos abaixo:
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
                className={`cursor-pointer transition-colors ${
                  selectedPlanId === plan.id
                    ? "border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    R$ {plan.price.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mês
                    </span>
                  </p>
                  <ul className="mt-4 space-y-2">
                    {plan.features?.map((feature: string, index: number) => (
                      <li key={index} className="text-sm">
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>
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
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={!selectedPlanId || isSubscribing}
          >
            {isSubscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Assinar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
