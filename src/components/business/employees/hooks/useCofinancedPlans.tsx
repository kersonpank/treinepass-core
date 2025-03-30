
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCofinancedPlans(businessSubscription: any) {
  // Fetch cofinanced plans based on the business subscription
  const { data: availablePlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["cofinancedPlans", businessSubscription?.benefit_plans?.id],
    queryFn: async () => {
      if (!businessSubscription?.benefit_plans) return [];
      
      // Only fetch subsidized plans
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("plan_type", "corporate_subsidized")
        .eq("status", "active");
        
      if (error) throw error;
      return data;
    },
    enabled: !!businessSubscription?.benefit_plans,
  });

  return {
    availablePlans,
    isLoadingPlans
  };
}
