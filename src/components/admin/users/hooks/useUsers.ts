
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "../types/user";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select(`
          *,
          user_profile_types (
            type
          )
        `);

      if (profilesError) throw profilesError;

      // Fetch plan subscriptions separately
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          user_id,
          status,
          start_date,
          end_date,
          benefit_plans (
            name
          )
        `);

      if (subscriptionsError) throw subscriptionsError;

      // Combine the data
      const usersWithSubscriptions = profiles.map(profile => ({
        ...profile,
        user_types: profile.user_profile_types,
        user_plan_subscriptions: subscriptions?.filter(sub => sub.user_id === profile.id) || []
      }));

      return usersWithSubscriptions as User[];
    },
  });
}
