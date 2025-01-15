import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { EmployeesList } from "@/components/dashboard/EmployeesList";
import { BenefitPlans } from "@/components/dashboard/BenefitPlans";
import { UsageReports } from "@/components/dashboard/UsageReports";
import { CostAnalysis } from "@/components/dashboard/CostAnalysis";
import { Overview } from "@/components/dashboard/Overview";

export default function DashboardEmpresa() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch business profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["businessProfile"],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("business_profiles")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching business profile:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar o perfil da empresa.",
        });
        throw error;
      }

      return profile;
    },
  });

  // Redirect if not authenticated or no business profile
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col space-y-6 p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {profile?.company_name}
        </h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="employees">Colaboradores</TabsTrigger>
          <TabsTrigger value="benefits">Planos</TabsTrigger>
          <TabsTrigger value="usage">Utilização</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Overview />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeesList />
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          <BenefitPlans />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageReports />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <CostAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen flex-col space-y-6 p-8">
      <Skeleton className="h-8 w-[300px]" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-4 w-[180px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}