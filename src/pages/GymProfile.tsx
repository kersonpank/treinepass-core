
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewPanel } from "@/components/gym/panels/OverviewPanel";
import { StaffPanel } from "@/components/gym/panels/StaffPanel";
import { FinancialPanel } from "@/components/gym/panels/FinancialPanel";
import { GymSettingsForm } from "@/components/gym/GymSettingsForm";
import { Button } from "@/components/ui/button";
import { CheckInManager } from "@/components/gym/check-in/CheckInManager";
import { CheckInHistory } from "@/components/gym/check-in/CheckInHistory";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PaymentsManagement } from "@/components/admin/payments/PaymentsManagement";
import { useParams } from "react-router-dom";

export function GymProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: gym, isLoading, error } = useQuery({
    queryKey: ["gym-profile", id],
    queryFn: async () => {
      console.log("Buscando academia com ID:", id);
      
      if (!id) throw new Error("ID da academia não fornecido");

      const { data, error } = await supabase
        .from("academias")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar academia:", error);
        throw error;
      }
      
      if (!data) {
        console.error("Academia não encontrada");
        throw new Error("Academia não encontrada");
      }
      
      console.log("Academia encontrada:", data);
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !gym) {
    console.error("Erro ao carregar academia:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Academia não encontrada</h1>
        <Button onClick={() => window.location.href = "/"}>
          Voltar para o início
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{gym.nome}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="check-in">Check-in</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="staff">Equipe</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel academia={gym} />
        </TabsContent>

        <TabsContent value="check-in" className="space-y-6">
          <CheckInManager gymId={gym.id} />
          <CheckInHistory gymId={gym.id} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialPanel />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsManagement />
        </TabsContent>

        <TabsContent value="staff">
          <StaffPanel gymId={gym.id} />
        </TabsContent>

        <TabsContent value="settings">
          <GymSettingsForm gymId={gym.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
