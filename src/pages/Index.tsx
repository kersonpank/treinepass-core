import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { UserTypeSelect } from "@/components/auth/UserTypeSelect";
import { LoginForm } from "@/components/auth/LoginForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao TreinePass",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleUserTypeSelect = (type: string) => {
    switch (type) {
      case "individual":
        navigate("/cadastro-pessoa-fisica");
        break;
      case "business":
        navigate("/cadastro-empresa");
        break;
      case "gym":
        navigate("/cadastro-academia");
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <AuthLayout
            title="TreinePass"
            subtitle="Conectando pessoas a academias de qualidade"
          >
            <div className="space-y-8">
              <LoginForm />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou crie uma nova conta
                  </span>
                </div>
              </div>

              <UserTypeSelect onSelect={handleUserTypeSelect} />
            </div>
          </AuthLayout>
        </div>
      </div>
    </div>
  );
}