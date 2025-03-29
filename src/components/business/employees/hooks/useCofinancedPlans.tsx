
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCofinancedPlans(businessSubscription: any) {
  // Fetch cofinanced plans based on the business plan
  const { data: availablePlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["cofinancedPlans", businessSubscription?.plan_id],
    queryFn: async () => {
      if (!businessSubscription?.plan_id) return [];
      
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("plan_type", "corporate_subsidized")
        .eq("status", "active");
        
      if (error) throw error;
      return data;
    },
    enabled: !!businessSubscription?.plan_id,
  });

  return {
    availablePlans,
    isLoadingPlans
  };
}
