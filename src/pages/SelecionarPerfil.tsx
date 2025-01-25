import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Dumbbell, User } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useToast } from "@/hooks/use-toast";

interface UserAccessType {
  type: 'individual' | 'business' | 'gym';
  profile_id: string;
  details: {
    gym_name?: string;
    company_name?: string;
    role?: string;
    status?: string;
  };
}

export default function SelecionarPerfil() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: accessTypes, isLoading } = useQuery({
    queryKey: ["userAccessTypes"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.rpc('get_user_access_types', {
        p_user_id: session.session.user.id
      });

      if (error) throw error;
      return data as UserAccessType[];
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const getAccessTypeDetails = (type: string) => {
    switch (type) {
      case 'individual':
        return {
          title: 'Área do Usuário',
          description: 'Acesse seus treinos e benefícios',
          icon: User,
          path: '/app'
        };
      case 'business':
        return {
          title: 'Portal Empresarial',
          description: 'Gerencie benefícios dos colaboradores',
          icon: Building2,
          path: '/dashboard-empresa'
        };
      case 'gym':
        return {
          title: 'Painel da Academia',
          description: 'Gerencie sua academia',
          icon: Dumbbell,
          path: '/academia'
        };
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0125F0]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <AuthLayout
            title="Selecionar Perfil"
            subtitle="Escolha qual perfil você deseja acessar"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accessTypes?.map((access) => {
                const details = getAccessTypeDetails(access.type);
                if (!details) return null;

                const Icon = details.icon;
                return (
                  <Card 
                    key={access.type}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      if (access.type === 'gym' && access.profile_id) {
                        navigate(`/academia/${access.profile_id}`);
                      } else {
                        navigate(details.path);
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-[#0125F0]" />
                        <CardTitle className="text-lg">{details.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {details.description}
                        {access.details?.gym_name && (
                          <div className="mt-2 text-sm font-medium text-gray-700">
                            {access.details.gym_name}
                          </div>
                        )}
                        {access.details?.company_name && (
                          <div className="mt-2 text-sm font-medium text-gray-700">
                            {access.details.company_name}
                          </div>
                        )}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/app')}
              >
                <User className="mr-2 h-4 w-4" />
                Continuar como usuário comum
              </Button>
            </div>
          </AuthLayout>
        </div>
      </div>
    </div>
  );
}