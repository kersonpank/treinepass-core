import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
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