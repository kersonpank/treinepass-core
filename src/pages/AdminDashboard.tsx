import { Overview } from "@/components/dashboard/Overview";
import { UsageReports } from "@/components/dashboard/UsageReports";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { RevenueOverview } from "@/components/admin/financial/RevenueOverview";
import { PaymentsList } from "@/components/admin/financial/PaymentsList";
import { PlansList } from "@/components/admin/plans/PlansList";

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Existem 3 academias pendentes de aprovação.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Overview />
          <div className="mt-8">
            <UsageReports />
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="space-y-8">
            <RevenueOverview />
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                <h3 className="text-lg font-medium">Pagamentos Recentes</h3>
                <PaymentsList />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plans">
          <div className="space-y-8">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                <h3 className="text-lg font-medium">Planos Disponíveis</h3>
                <PlansList />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}