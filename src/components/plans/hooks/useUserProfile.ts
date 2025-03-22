
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserProfile() {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile;
    },
  });
}

export function useBusinessAccess(userProfile: any) {
  return useQuery({
    queryKey: ["businessAccess", userProfile?.cpf],
    queryFn: async () => {
      if (!userProfile?.cpf) return false;

      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('cpf', userProfile.cpf)
        .eq('status', 'active')
        .limit(1);

      return employees && employees.length > 0;
    },
    enabled: !!userProfile?.cpf,
  });
}
