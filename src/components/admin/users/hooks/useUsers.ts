
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
          ),
          user_plan_subscriptions (
            status,
            start_date,
            end_date,
            benefit_plans (
              name
            )
          )
        `);

      if (profilesError) throw profilesError;
      return profiles as User[];
    },
  });
}
