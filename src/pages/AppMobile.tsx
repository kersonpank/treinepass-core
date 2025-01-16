import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
import { Feed } from "@/components/mobile/Feed";
import { GymSearch } from "@/components/mobile/GymSearch";
import { ClassSchedule } from "@/components/mobile/ClassSchedule";
import { DigitalCard } from "@/components/mobile/DigitalCard";
import { GymManagement } from "@/components/dashboard/GymManagement";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {isGymOwner && (
            <Button variant="outline" onClick={goToGymPanel}>
              <Building2 className="mr-2 h-4 w-4" />
              Painel da Academia
            </Button>
          )}
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="search">Buscar</TabsTrigger>
          <TabsTrigger value="schedule">Agenda</TabsTrigger>
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

        <TabsContent value="card">
          <DigitalCard />
        </TabsContent>
      </Tabs>

      {isGymOwner && <GymManagement />}
    </div>
  );
}