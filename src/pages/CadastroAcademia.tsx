import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { GymRegistrationForm } from "@/components/gym/GymRegistrationForm";
import { registerGym } from "@/services/gym";

export default function CadastroAcademia() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch modalidades
  const { data: modalidades } = useQuery({
    queryKey: ["modalidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modalidades").select("*");
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Primeiro tenta fazer login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      let userId;

      // Se o login falhar por credenciais inválidas, cria um novo usuário
      if (signInError && signInError.message.includes("Invalid login credentials")) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
            },
          },
        });

        if (signUpError) throw signUpError;
        userId = authData.user?.id;

        // Criar perfil do usuário
        if (userId) {
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              id: userId,
              full_name: data.full_name,
              cpf: "", // Como é academia, CPF não é obrigatório
              birth_date: new Date().toISOString(), // Data atual como placeholder
            });

          if (profileError) throw profileError;
        }
      } else if (signInError) {
        throw signInError;
      } else {
        userId = signInData.user?.id;
      }

      if (!userId) {
        throw new Error("Erro ao processar usuário");
      }

      // Registra a academia
      const academia = await registerGym(data, userId);

      toast({
        title: "Academia cadastrada com sucesso!",
        description: "Seus dados foram salvos e você será redirecionado para o painel.",
      });

      // Redireciona para o painel da academia
      navigate(`/academia/${academia.id}`);
    } catch (error: any) {
      console.error("Error during gym registration:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar academia",
        description: error.message || "Ocorreu um erro ao salvar os dados. Tente novamente.",
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