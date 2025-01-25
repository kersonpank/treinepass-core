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
    console.log("Iniciando processo de cadastro de academia...");
    try {
      setIsSubmitting(true);

      const result = await registerGym(data);
      console.log("Resultado do registro da academia:", result);

      if (!result.academia_id) {
        throw new Error("ID da academia não retornado");
      }

      // Tentar fazer login automático após o registro
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.error("Erro ao fazer login automático:", signInError);
        throw signInError;
      }

      console.log("Academia registrada com sucesso:", result);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua academia foi cadastrada e você será redirecionado para o painel.",
      });

      // Adicionar um pequeno delay antes do redirecionamento
      setTimeout(() => {
        navigate(`/academia/${result.academia_id}`);
      }, 1000);

    } catch (error: any) {
      console.error("Erro detalhado durante o cadastro:", error);
      
      const errorMessage = error.message || "Ocorreu um erro inesperado. Por favor, tente novamente.";
      
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: errorMessage,
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