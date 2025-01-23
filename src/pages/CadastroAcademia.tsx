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

      const academia = await registerGym(data);

      console.log("Academia registrada com sucesso:", academia);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua academia foi cadastrada e você será redirecionado para o painel.",
      });

      navigate(`/academia/${academia.academia_id}`);
    } catch (error: any) {
      console.error("Erro detalhado durante o cadastro:", error);
      
      // Mensagens de erro mais específicas baseadas no erro retornado
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