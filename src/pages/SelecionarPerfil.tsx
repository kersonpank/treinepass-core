import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserTypeSelect } from "@/components/auth/UserTypeSelect";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useToast } from "@/hooks/use-toast";

export default function SelecionarPerfil() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: userTypes, isLoading } = useQuery({
    queryKey: ["userTypes"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("user_types")
        .select("type, profile_id")
        .eq("user_id", session.session.user.id);

      if (error) throw error;
      return data;
    },
  });

  const handleProfileSelect = async (type: string) => {
    const profileId = userTypes?.find(ut => ut.type === type)?.profile_id;
    
    if (!profileId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Perfil não encontrado",
      });
      return;
    }

    switch (type) {
      case "individual":
        navigate("/app");
        break;
      case "business":
        navigate("/dashboard-empresa");
        break;
      case "gym":
        navigate(`/academia/${profileId}`);
        break;
      default:
        navigate("/");
    }
  };

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
            {userTypes && userTypes.length > 0 ? (
              <UserTypeSelect
                onSelect={handleProfileSelect}
                availableTypes={userTypes.map(ut => ut.type)}
              />
            ) : (
              <p className="text-center text-gray-600">
                Nenhum perfil encontrado. Por favor, entre em contato com o suporte.
              </p>
            )}
          </AuthLayout>
        </div>
      </div>
    </div>
  );
}