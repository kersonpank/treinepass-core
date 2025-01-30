import { Overview } from "@/components/dashboard/Overview";
import { UsageReports } from "@/components/dashboard/UsageReports";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Building2, Users, Activity, Settings } from "lucide-react";
import { RevenueOverview } from "@/components/admin/financial/RevenueOverview";
import { PaymentsList } from "@/components/admin/financial/PaymentsList";
import { PlansManagement } from "@/components/admin/plans/PlansManagement";
import { ModalitiesManagement } from "@/components/admin/modalities/ModalitiesManagement";
import { GymManagement } from "@/components/admin/gyms/GymManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserManagement } from "@/components/admin/users/UserManagement";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch pending gyms
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

  // Fetch active gyms count
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

  // Fetch active users count
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

  // Fetch total check-ins count
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

  // Fetch active plans count
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

  // Fetch users with their types
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // First get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Then get user types for each profile
      const usersWithTypes = await Promise.all(
        profiles.map(async (profile) => {
          const { data: types, error: typesError } = await supabase
            .from("user_types")
            .select("type")
            .eq("user_id", profile.id);

          if (typesError) throw typesError;

          return {
            ...profile,
            user_types: types || []
          };
        })
      );

      return usersWithTypes;
    },
  });

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo ao painel administrativo do TreinePass
          </p>
        </div>
      </div>
      
      {pendingGyms > 0 && (
        <Alert variant="destructive" className="animate-fadeIn">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Existem {pendingGyms} {pendingGyms === 1 ? 'academia pendente' : 'academias pendentes'} de aprovação.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academias Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGymsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de academias ativas no sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuários cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de check-ins realizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlansCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de planos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-[600px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="modalities">Modalidades</TabsTrigger>
          <TabsTrigger value="gyms">Academias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Overview />
          <UsageReports />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
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

        <TabsContent value="gyms">
          <GymManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}