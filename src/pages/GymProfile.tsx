
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewPanel } from "@/components/gym/panels/OverviewPanel";
import { Button } from "@/components/ui/button";
import { CheckInManager } from "@/components/gym/check-in/CheckInManager";
import { CheckInHistory } from "@/components/gym/check-in/CheckInHistory";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

export function GymProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: gym, isLoading, error } = useQuery({
    queryKey: ["gym", id],
    queryFn: async () => {
      console.log("Buscando academia com ID:", id);
      
      if (!id) throw new Error("ID da academia não fornecido");

      const { data, error } = await supabase
        .from("academias")
        .select(`
          *,
          academia_modalidades (
            modalidade:modalidades (
              id,
              nome
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar academia:", error);
        throw error;
      }

      console.log("Academia encontrada:", data);
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Não foi possível carregar os dados da academia.",
    });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">Academia não encontrada</h1>
        <Button onClick={() => navigate("/app")}>
          Voltar
        </Button>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">Academia não encontrada</h1>
        <Button onClick={() => navigate("/app")}>
          Voltar
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
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel academia={gym} />
        </TabsContent>

        <TabsContent value="check-in" className="space-y-6">
          <CheckInManager gymId={gym.id} />
          <CheckInHistory gymId={gym.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
