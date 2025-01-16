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
      
      // Primeiro tenta criar um novo usuário
      let authData = null;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      // Se o usuário já existe, tenta fazer login
      if (signUpError?.message.includes("User already registered")) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) throw signInError;
        authData = signInData;
      } else if (signUpError) {
        throw signUpError;
      } else {
        authData = signUpData;
      }

      const userId = authData?.user?.id;
      if (!userId) {
        throw new Error("Erro ao processar usuário");
      }

      // Criar perfil do usuário se necessário
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select()
        .eq("id", userId)
        .single();

      if (!existingProfile) {
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