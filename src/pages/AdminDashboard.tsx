
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/admin/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/admin/dashboard/DashboardTabs";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: pendingGyms = 0 } = useQuery({
    queryKey: ["pendingGyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select("id")
        .eq("status", "pendente");
      
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const { data: activeGymsCount = 0 } = useQuery({
    queryKey: ["activeGyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select("id")
        .eq("status", "ativo");
      
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const { data: activeUsersCount = 0 } = useQuery({
    queryKey: ["activeUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id");
      
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const { data: checkInsCount = 0 } = useQuery({
    queryKey: ["checkIns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_usage")
        .select("id");
      
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const { data: activePlansCount = 0 } = useQuery({
    queryKey: ["activePlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("id")
        .eq("status", "active");
      
      if (error) throw error;
      return data?.length || 0;
    },
  });

  return (
    <div className="flex-1 space-y-8">
      <DashboardHeader pendingGyms={pendingGyms} />
      
      <DashboardStats
        activeGymsCount={activeGymsCount}
        activeUsersCount={activeUsersCount}
        checkInsCount={checkInsCount}
        activePlansCount={activePlansCount}
      />

      <DashboardTabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />
    </div>
  );
}
