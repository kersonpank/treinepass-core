
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
  const [activeTab, setActiveTab] = useState("check-in");

  const { data: gym, isLoading, error } = useQuery({
    queryKey: ["gym", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da academia não fornecido");

      const { data, error } = await supabase
        .from("academias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
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

  if (error || !gym) {
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{gym.nome}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="check-in">Check-in</TabsTrigger>
          <TabsTrigger value="overview">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="check-in" className="space-y-6">
          <CheckInManager gymId={id} />
          <CheckInHistory gymId={id} />
        </TabsContent>

        <TabsContent value="overview">
          <OverviewPanel academia={gym} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
