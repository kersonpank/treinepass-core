import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { GymSearch } from "@/components/mobile/GymSearch";
import { ClassSchedule } from "@/components/mobile/ClassSchedule";
import { DigitalCard } from "@/components/mobile/DigitalCard";
import { PlansTab } from "@/components/mobile/PlansTab";
import { GymProfile } from "@/pages/GymProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AppMobile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

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

  const defaultTab = location.pathname.includes('/plans') ? 'plans' : 'search';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">TreinePass</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 pt-20 pb-8">
        <Routes>
          <Route path="gym/:id" element={<GymProfile />} />
          <Route path="*" element={
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search">Buscar</TabsTrigger>
                <TabsTrigger value="schedule">Agenda</TabsTrigger>
                <TabsTrigger value="plans">Planos</TabsTrigger>
                <TabsTrigger value="card">Cartão</TabsTrigger>
              </TabsList>

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
          } />
        </Routes>
      </main>
    </div>
  );
}