
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserMetrics() {
  return useQuery({
    queryKey: ["userMetrics"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: inactiveUsers }
      ] = await Promise.all([
        supabase.from("user_profiles").select("*", { count: "exact" }),
        supabase.from("user_profiles").select("*", { count: "exact" }).eq("active", true),
        supabase.from("user_profiles").select("*", { count: "exact" }).eq("active", false)
      ]);

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
      };
    }
  });
}
