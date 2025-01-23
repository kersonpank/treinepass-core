import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { GymSettingsForm } from "@/components/gym/GymSettingsForm";
import { OverviewPanel } from "@/components/gym/panels/OverviewPanel";
import { StaffPanel } from "@/components/gym/panels/StaffPanel";

interface UserProfile {
  full_name: string | null;
  email: string | null;
}

interface StaffMember {
  id: string;
  role: "gym_owner" | "gym_admin" | "gym_staff";
  active: boolean;
  user_id: string;
  user_profiles: UserProfile | null;
}

export default function AcademiaPanel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: academia, isLoading: loadingAcademia } = useQuery({
    queryKey: ["academia", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da academia não fornecido");

      const { data, error } = await supabase
        .from("academias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  if (loadingAcademia) {
    return <div>Carregando...</div>;
  }

  if (!academia) {
    return <div>Academia não encontrada</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{academia.nome}</h1>
          <p className="text-gray-500">{academia.endereco}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="access">Gestão de Acessos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel academia={academia} />
        </TabsContent>

        <TabsContent value="access">
          <StaffPanel staffMembers={[]} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Academia</CardTitle>
            </CardHeader>
            <CardContent>
              {academia && (
                <GymSettingsForm
                  academia={academia}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["academia", id] });
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}