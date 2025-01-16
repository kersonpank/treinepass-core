import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface StaffMember {
  id: string;
  role: "gym_owner" | "gym_admin" | "gym_staff";
  active: boolean;
  user_id: string;
  user_profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AcademiaPanel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const { data: staffMembers, isLoading: loadingStaff } = useQuery({
    queryKey: ["academia-staff", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da academia não fornecido");

      const { data, error } = await supabase
        .from("user_gym_roles")
        .select(`
          id,
          role,
          active,
          user_id,
          user_profiles:user_id (
            full_name,
            email
          )
        `)
        .eq("gym_id", id);

      if (error) throw error;
      return data as StaffMember[];
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

  if (loadingAcademia || loadingStaff) {
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/app")}>
            <Smartphone className="mr-2 h-4 w-4" />
            App
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="access">Gestão de Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">CNPJ</h3>
                  <p>{academia.cnpj}</p>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p>{academia.email}</p>
                </div>
                <div>
                  <h3 className="font-medium">Telefone</h3>
                  <p>{academia.telefone}</p>
                </div>
                <div>
                  <h3 className="font-medium">Modalidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {academia.modalidades.map((modalidade: string) => (
                      <span
                        key={modalidade}
                        className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                      >
                        {modalidade}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>Convidar Funcionário</Button>

                <div className="grid gap-4">
                  {staffMembers?.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {member.user_profiles?.full_name || "Nome não disponível"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.user_profiles?.email || "Email não disponível"}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${
                                member.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {member.active ? "Ativo" : "Inativo"}
                            </span>
                            <Button variant="outline" size="sm">
                              Gerenciar Acesso
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}