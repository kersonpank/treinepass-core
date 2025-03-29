
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useBusinessPlanCancellation() {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelPlan = async (subscriptionId?: string, businessId?: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get the subscription to cancel
      let subscriptionToCancel;
      
      if (subscriptionId) {
        // If a specific subscription ID was provided
        const { data, error } = await supabase
          .from("business_plan_subscriptions")
          .select("*")
          .eq("id", subscriptionId)
          .single();
          
        if (error) throw error;
        subscriptionToCancel = data;
      } else if (businessId) {
        // Get active subscription for the business
        const { data, error } = await supabase
          .from("business_plan_subscriptions")
          .select("*")
          .eq("business_id", businessId)
          .eq("status", "active")
          .single();
          
        if (error) throw error;
        subscriptionToCancel = data;
      } else {
        // Try to find the business id for the current user
        const { data: business, error: businessError } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
          
        if (businessError || !business) {
          throw new Error("Perfil de empresa não encontrado");
        }
        
        // Get active subscription for the business
        const { data, error } = await supabase
          .from("business_plan_subscriptions")
          .select("*")
          .eq("business_id", business.id)
          .eq("status", "active")
          .single();
          
        if (error) throw error;
        subscriptionToCancel = data;
      }

      if (!subscriptionToCancel) {
        throw new Error("Nenhuma assinatura empresarial encontrada para cancelar");
      }

      // Cancel subscription in our database
      const { error } = await supabase
        .from("business_plan_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", subscriptionToCancel.id);

      if (error) throw error;

      // Cancel in Asaas if there's an asaas_subscription_id
      if (subscriptionToCancel.asaas_subscription_id) {
        const { error: cancelError } = await supabase.functions.invoke("cancel-asaas-subscription", {
          body: {
            asaasSubscriptionId: subscriptionToCancel.asaas_subscription_id
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
        title: "Plano cancelado com sucesso",
        description: "O cancelamento será efetivado imediatamente.",
      });
      
      setShowCancelDialog(false);
      return true;
    } catch (error: any) {
      console.error("Erro ao cancelar plano:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar plano",
        description: error.message,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    isLoading
  };
}
