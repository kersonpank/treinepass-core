import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
import { Feed } from "@/components/mobile/Feed";
import { GymSearch } from "@/components/mobile/GymSearch";
import { ClassSchedule } from "@/components/mobile/ClassSchedule";
import { DigitalCard } from "@/components/mobile/DigitalCard";
import { PlansTab } from "@/components/mobile/PlansTab";
import { GymManagement } from "@/components/dashboard/GymManagement";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AppMobile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: isGymOwner } = useQuery({
    queryKey: ["isGymOwner"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_gym_roles")
        .select("role")
        .eq("role", "gym_owner")
        .eq("active", true);
      
      return roles && roles.length > 0;
    },
  });

  const { data: userGym } = useQuery({
    queryKey: ["userGym"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_gym_roles")
        .select("gym_id")
        .eq("role", "gym_owner")
        .eq("active", true)
        .single();
      
      return roles;
    },
    enabled: isGymOwner,
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
      });
      return;
    }
    navigate("/");
  };

  const goToGymPanel = () => {
    if (userGym?.gym_id) {
      navigate(`/academia/${userGym.gym_id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">TreinePass</h1>
          <div className="flex gap-2">
            {isGymOwner && (
              <Button variant="outline" size="sm" onClick={goToGymPanel}>
                <Building2 className="mr-2 h-4 w-4" />
                Painel
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 pt-20 pb-8">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="search">Buscar</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="card">Cartão</TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <Feed />
          </TabsContent>

          <TabsContent value="search">
            <GymSearch />
          </TabsContent>

          <TabsContent value="schedule">
            <ClassSchedule />
          </TabsContent>

          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>

          <TabsContent value="card">
            <DigitalCard />
          </TabsContent>
        </Tabs>

        {isGymOwner && <GymManagement />}
      </main>
    </div>
  );
}