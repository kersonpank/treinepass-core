import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { GymRegistrationForm } from "@/components/gym/GymRegistrationForm";
import { registerGym } from "@/services/gym";

export default function CadastroAcademia() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch modalidades
  const { data: modalidades } = useQuery({
    queryKey: ["modalidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modalidades").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Check for logged-in user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user already has a profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setCurrentUser({ ...session.user, hasProfile: !!profile });
      } else {
        setCurrentUser(null);
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setCurrentUser({ ...session.user, hasProfile: !!profile });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      let userId = currentUser?.id;

      // If user is not logged in or doesn't have a profile, create a new account
      if (!userId || !currentUser?.hasProfile) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: crypto.randomUUID(), // Generate a random password
          options: {
            emailRedirectTo: `${window.location.origin}/reset-password`,
          },
        });

        if (authError) throw authError;
        userId = authData.user?.id;

        if (!userId) {
          throw new Error("Erro ao criar usuário");
        }

        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para definir sua senha.",
        });
      }

      // Register the gym and assign the gym_owner role
      const academia = await registerGym(data, userId);

      toast({
        title: "Academia cadastrada com sucesso!",
        description: "Seus dados foram salvos e estão em análise.",
      });

      // Redirect to the gym's dashboard
      navigate(`/academia/${academia.id}`);
    } catch (error: any) {
      console.error("Error during gym registration:", error);
      toast({
        title: "Erro ao cadastrar academia",
        description: error.message || "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Cadastro de Academia
          </h1>

          <GymRegistrationForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            modalidades={modalidades}
          />
        </div>
      </div>
    </div>
  );
}