import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Gym {
  id: string;
  nome: string;
  endereco: string;
  status: string;
}

export function GymManagement() {
  const navigate = useNavigate();
  
  const { data: gyms, isLoading } = useQuery({
    queryKey: ["userGyms"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: roles } = await supabase
        .from("user_gym_roles")
        .select("gym_id")
        .eq("user_id", user.id)
        .eq("active", true);

      if (!roles?.length) return [];

      const { data: gyms } = await supabase
        .from("academias")
        .select("*")
        .in(
          "id",
          roles.map((r) => r.gym_id)
        );

      return gyms || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0125F0]"></div>
      </div>
    );
  }

  if (!gyms?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Minhas Academias</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gyms.map((gym) => (
          <Card key={gym.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#0125F0]" />
                {gym.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{gym.endereco}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  gym.status === 'ativo' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {gym.status === 'ativo' ? 'Ativo' : 'Pendente'}
                </span>
                <Button
                  onClick={() => navigate(`/academia/${gym.id}`)}
                  className="flex items-center gap-2"
                >
                  Acessar Painel
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}