import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Feed } from "@/components/mobile/Feed";
import { GymSearch } from "@/components/mobile/GymSearch";
import { ClassSchedule } from "@/components/mobile/ClassSchedule";
import { DigitalCard } from "@/components/mobile/DigitalCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AppMobile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("feed");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="feed" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="fixed bottom-0 left-0 right-0 grid w-full grid-cols-4 bg-background border-t">
          <TabsTrigger value="feed" className="data-[state=active]:bg-primary/10">
            Feed
          </TabsTrigger>
          <TabsTrigger value="search" className="data-[state=active]:bg-primary/10">
            Academias
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-primary/10">
            Aulas
          </TabsTrigger>
          <TabsTrigger value="card" className="data-[state=active]:bg-primary/10">
            Carteirinha
          </TabsTrigger>
        </TabsList>

        <div className="pb-16">
          <TabsContent value="feed" className="m-0">
            <Feed />
          </TabsContent>
          <TabsContent value="search" className="m-0">
            <GymSearch />
          </TabsContent>
          <TabsContent value="schedule" className="m-0">
            <ClassSchedule />
          </TabsContent>
          <TabsContent value="card" className="m-0">
            <DigitalCard />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}