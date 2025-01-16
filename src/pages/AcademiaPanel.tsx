import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export default function AcademiaPanel() {
  const { id } = useParams();

  const { data: academia, isLoading: loadingAcademia } = useQuery({
    queryKey: ["academia", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: staffMembers, isLoading: loadingStaff } = useQuery({
    queryKey: ["academia-staff", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_gym_roles")
        .select(`
          id,
          role,
          active,
          user_id,
          users:user_id (
            email
          )
        `)
        .eq("gym_id", id);

      if (error) throw error;

      // Fetch user profiles for each staff member
      const staffWithProfiles = await Promise.all(
        data.map(async (staff) => {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("full_name")
            .eq("id", staff.user_id)
            .single();

          return {
            ...staff,
            user_profile: profile,
          };
        })
      );

      return staffWithProfiles;
    },
  });

  if (loadingAcademia || loadingStaff) {
    return <div>Carregando...</div>;
  }

  if (!academia) {
    return <div>Academia não encontrada</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{academia.nome}</h1>
        <p className="text-gray-500">{academia.endereco}</p>
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
                              {member.user_profile?.full_name || "Nome não disponível"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.users?.email || "Email não disponível"}
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