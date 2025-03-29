
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEmployeeSubscription() {
  // Get current user subscription
  const { 
    data: userSubscription, 
    isLoading: isLoadingUserSubscription, 
    refetch: refetchUserSubscription 
  } = useQuery({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching subscription:", error);
        throw error;
      }
      
      return data;
    },
  });

  return {
    userSubscription,
    isLoadingUserSubscription,
    refetchUserSubscription
  };
}
