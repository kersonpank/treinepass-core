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

      // 1. Verificar se o email já existe
      const { count: emailCount, error: emailError } = await supabase
        .from("academias")
        .select("id", { count: 'exact', head: true })
        .eq("email", data.email);

      if (emailError) throw emailError;
      if (emailCount && emailCount > 0) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: "Este email já está registrado. Por favor, use outro email.",
        });
        return;
      }

      // 2. Verificar se o CNPJ já existe
      const { count: cnpjCount, error: cnpjError } = await supabase
        .from("academias")
        .select("id", { count: 'exact', head: true })
        .eq("cnpj", data.cnpj.replace(/\D/g, ""));

      if (cnpjError) throw cnpjError;
      if (cnpjCount && cnpjCount > 0) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: "Este CNPJ já está cadastrado no sistema.",
        });
        return;
      }

      // 3. Se passou por todas as verificações, criar o usuário e a academia
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      const userId = authData?.user?.id;
      if (!userId) {
        throw new Error("Erro ao processar usuário");
      }

      // 4. Registrar a academia
      const academia = await registerGym(data, userId);

      toast({
        title: "Academia cadastrada com sucesso!",
        description: "Seus dados foram salvos e você será redirecionado para o painel.",
      });

      navigate(`/academia/${academia.id}`);
    } catch (error: any) {
      console.error("Error during gym registration:", error);
      
      // Se houver erro após a criação do usuário, tentar limpar
      if (error.userId) {
        await supabase.auth.admin.deleteUser(error.userId);
      }

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