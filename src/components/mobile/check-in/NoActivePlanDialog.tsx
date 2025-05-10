
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NoActivePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoActivePlanDialog({ open, onOpenChange }: NoActivePlanDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedPlanId, setRecommendedPlanId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecommendedPlan = async () => {
      if (!open) return;

      try {
        // Check if benefit_plans table exists and get a recommended plan
        try {
          const { data: plans, error: plansError } = await supabase
            .from('benefit_plans')
            .select('id')
            .eq('status', 'active')
            .order('monthly_cost', { ascending: true })
            .limit(1);

          if (!plansError && plans && plans.length > 0) {
            setRecommendedPlanId(plans[0].id);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.log("Tabela benefit_plans não encontrada, tentando user_plan_subscriptions");
        }

        // Check if the user has any previous subscription that might have expired
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          try {
            const { data: subscriptions } = await supabase
              .from('user_plan_subscriptions')
              .select('plan_id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (subscriptions && subscriptions.length > 0) {
              setRecommendedPlanId(subscriptions[0].plan_id);
            }
          } catch (err) {
            console.log("Erro ao buscar assinatura anterior:", err);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar plano recomendado:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedPlan();
  }, [open]);

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate("/app/plans");
  };

  const handleSubscribeToPlan = () => {
    if (!recommendedPlanId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível encontrar um plano recomendado.",
      });
      return;
    }
    
    onOpenChange(false);
    navigate(`/app/plans/${recommendedPlanId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Plano Necessário</DialogTitle>
          <DialogDescription>
            Para fazer check-in nesta academia, você precisa ter um plano ativo.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p>
              Você não possui um plano ativo no momento. Para continuar,
              assine um de nossos planos.
            </p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleViewPlans} 
            className="w-full sm:w-auto"
          >
            Ver Todos os Planos
          </Button>
          
          {recommendedPlanId && (
            <Button 
              onClick={handleSubscribeToPlan}
              className="w-full sm:w-auto"
            >
              Assinar Plano Recomendado
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
