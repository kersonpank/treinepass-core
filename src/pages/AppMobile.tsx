import { Routes, Route } from "react-router-dom";
import { UserAccess } from "@/components/mobile/UserAccess";
import { GymSearch } from "@/components/mobile/GymSearch";
import { DigitalCard } from "@/components/mobile/DigitalCard";
import { Feed } from "@/components/mobile/Feed";
import { ClassSchedule } from "@/components/mobile/ClassSchedule";
import { PlansTab } from "@/components/mobile/PlansTab";
import { Home, Calendar, CreditCard, Dumbbell, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
      <div className="flex justify-between items-center max-w-screen-xl mx-auto">
        <Button
          variant={isActive('/app') ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1"
          onClick={() => navigate('/app')}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Início</span>
        </Button>

        <Button
          variant={isActive('/app/feed') ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1"
          onClick={() => navigate('/app/feed')}
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-xs">Academias</span>
        </Button>

        <Button
          variant={isActive('/app/schedule') ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1"
          onClick={() => navigate('/app/schedule')}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">Horários</span>
        </Button>

        <Button
          variant={isActive('/app/plans') ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1"
          onClick={() => navigate('/app/plans')}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-xs">Planos</span>
        </Button>
      </div>
    </div>
  );
};

export default function AppMobile() {
  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Meus Acessos</h1>
              <UserAccess />
              <div className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Academias Próximas</h2>
                <GymSearch />
              </div>
            </div>
          } />
          <Route path="/digital-card/:gymId" element={<DigitalCard />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/schedule" element={<ClassSchedule />} />
          <Route path="/plans" element={<PlansTab />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}