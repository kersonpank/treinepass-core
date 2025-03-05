
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function usePlanCancellation() {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancelPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_plan_subscriptions")
        .update({
          status: "cancelled",
        })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      toast({
        title: "Plano cancelado com sucesso",
        description: "O cancelamento será efetivado no próximo ciclo de cobrança.",
      });
      
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error canceling plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar plano",
        description: error.message,
      });
    }
  };

  return {
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan
  };
}
