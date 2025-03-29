
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailablePlansList } from "@/components/plans/AvailablePlansList";
import { UserSubscriptions } from "@/components/plans/UserSubscriptions";
import { BusinessEmployeePlans } from "@/components/business/employees/BusinessEmployeePlans";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/components/plans/hooks/useUserProfile";

export function PlansTab() {
  const { data: userProfile } = useUserProfile();
  
  // Check if user has a business relationship
  const { data: employeeData } = useQuery({
    queryKey: ["employeeBusinessData"],
    queryFn: async () => {
      if (!userProfile?.cpf) return null;
      
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          business_profiles (*)
        `)
        .eq("cpf", userProfile.cpf)
        .eq("status", "active")
        .maybeSingle();
        
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!userProfile?.cpf,
  });

  const hasBusinessAccess = !!employeeData?.business_id;

  return (
    <Tabs defaultValue="available" className="w-full">
      <TabsList className={`grid w-full ${hasBusinessAccess ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <TabsTrigger value="available">Planos Disponíveis</TabsTrigger>
        <TabsTrigger value="subscriptions">Minhas Assinaturas</TabsTrigger>
        {hasBusinessAccess && (
          <TabsTrigger value="business">Planos Empresariais</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="available" className="mt-4">
        <AvailablePlansList hasBusinessAccess={hasBusinessAccess} />
      </TabsContent>

      <TabsContent value="subscriptions" className="mt-4">
        <UserSubscriptions />
      </TabsContent>

      {hasBusinessAccess && (
        <TabsContent value="business" className="mt-4">
          <BusinessEmployeePlans />
        </TabsContent>
      )}
    </Tabs>
  );
}
