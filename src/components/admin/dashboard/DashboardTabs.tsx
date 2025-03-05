
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/Overview";
import { UsageReports } from "@/components/dashboard/UsageReports";
import { RevenueOverview } from "@/components/admin/financial/RevenueOverview";
import { PaymentsList } from "@/components/admin/financial/PaymentsList";
import { PlansManagement } from "@/components/admin/plans/PlansManagement";
import { ModalitiesManagement } from "@/components/admin/modalities/ModalitiesManagement";
import { GymManagement } from "@/components/admin/gyms/GymManagement";
import { CategoriesManagement } from "@/components/admin/categories/CategoriesManagement";
import { SystemSettings } from "@/components/admin/settings/SystemSettings";
import { UserManagement } from "@/components/admin/users/UserManagement";
import { BusinessManagement } from "@/components/admin/business/BusinessManagement";

interface DashboardTabsProps {
  selectedTab: string;
  onTabChange: (value: string) => void;
}

export function DashboardTabs({ selectedTab, onTabChange }: DashboardTabsProps) {
  return (
    <Tabs value={selectedTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-9 lg:w-[900px]">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="business">Empresas</TabsTrigger>
        <TabsTrigger value="financial">Financeiro</TabsTrigger>
        <TabsTrigger value="plans">Planos</TabsTrigger>
        <TabsTrigger value="modalities">Modalidades</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="gyms">Academias</TabsTrigger>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Overview />
        <UsageReports />
      </TabsContent>

      <TabsContent value="users" className="space-y-4">
        <UserManagement />
      </TabsContent>

      <TabsContent value="business">
        <BusinessManagement />
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <RevenueOverview />
        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Pagamentos Recentes</h3>
            <PaymentsList />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="plans">
        <PlansManagement />
      </TabsContent>

      <TabsContent value="modalities">
        <ModalitiesManagement />
      </TabsContent>

      <TabsContent value="categories">
        <CategoriesManagement />
      </TabsContent>

      <TabsContent value="gyms">
        <GymManagement />
      </TabsContent>

      <TabsContent value="settings">
        <SystemSettings />
      </TabsContent>
    </Tabs>
  );
}
