import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserAccessType = {
  type: string;
  profile_id: string;
  details: {
    gym_name?: string;
    company_name?: string;
    role?: string;
    status?: string;
  };
}

export function UserAccess() {
  const [accessTypes, setAccessTypes] = useState<UserAccessType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadAccessTypes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase.rpc('get_user_access_types', {
          p_user_id: session.user.id
        });

        if (error) throw error;

        setAccessTypes(data || []);
      } catch (error) {
        console.error("Error loading access types:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar seus acessos",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAccessTypes();
  }, [toast]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {accessTypes.map((access) => {
        if (access.type === 'gym' && access.profile_id) {
          return (
            <Card key={access.profile_id} className="cursor-pointer hover:bg-gray-50">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {access.details.gym_name || 'Academia'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {access.details.role === 'gym_owner' ? 'Proprietário' : 'Administrador'}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/academia/${access.profile_id}`)}
                >
                  Acessar Painel
                </Button>
              </CardContent>
            </Card>
          );
        }

        if (access.type === 'business' && access.profile_id) {
          return (
            <Card key={access.profile_id} className="cursor-pointer hover:bg-gray-50">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {access.details.company_name || 'Empresa'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {access.details.status === 'pending' ? 'Pendente' : 'Ativo'}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/dashboard-empresa')}
                >
                  Acessar Dashboard
                </Button>
              </CardContent>
            </Card>
          );
        }

        return null;
      })}
    </div>
  );
}