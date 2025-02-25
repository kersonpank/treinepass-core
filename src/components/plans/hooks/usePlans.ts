
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlans(hasBusinessAccess: boolean | undefined) {
  return useQuery({
    queryKey: ["availablePlans", hasBusinessAccess],
    queryFn: async () => {
      let query = supabase
        .from("benefit_plans")
        .select("*, business_profiles(company_name)")
        .eq("status", "active");

      if (!hasBusinessAccess) {
        query = query.eq("plan_type", "individual");
      } else {
        query = query.or("plan_type.eq.individual,plan_type.eq.corporate_subsidized");
      }

      const { data, error } = await query.order("monthly_cost");
      if (error) throw error;
      return data;
    },
  });
}
