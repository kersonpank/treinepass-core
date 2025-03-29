
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEmployeeBusinessData() {
  // Get employee business association
  const { data: employeeData, isLoading: isLoadingEmployeeData } = useQuery({
    queryKey: ["employeeData"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('cpf')
        .eq('id', user.id)
        .single();
        
      if (!userProfile?.cpf) return null;
        
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          business_profiles (*)
        `)
        .eq("cpf", userProfile.cpf)
        .eq("status", "active")
        .single();
        
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  // Fetch business subscription and available plans
  const { data: businessSubscription, isLoading: isLoadingBusinessSub } = useQuery({
    queryKey: ["businessSubscription", employeeData?.business_id],
    queryFn: async () => {
      if (!employeeData?.business_id) return null;
      
      const { data, error } = await supabase
        .from("business_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("business_id", employeeData.business_id)
        .eq("status", "active")
        .single();
        
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!employeeData?.business_id,
  });

  return {
    employeeData,
    businessSubscription,
    isLoadingEmployeeData,
    isLoadingBusinessSub
  };
}
