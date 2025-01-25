import { Routes, Route } from "react-router-dom";
import { UserAccess } from "@/components/mobile/UserAccess";
import { GymSearch } from "@/components/mobile/GymSearch";
import { DigitalCard } from "@/components/mobile/DigitalCard";
import { Feed } from "@/components/mobile/Feed";
import { ClassSchedule } from "@/components/mobile/ClassSchedule";
import { PlansTab } from "@/components/mobile/PlansTab";

export default function AppMobile() {
  return (
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
  );
}