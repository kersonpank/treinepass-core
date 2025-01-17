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

      // 1. Verificar se o email já existe em qualquer academia
      console.log("Verificando existência do email:", data.email);
      const { count: emailCount, error: emailError } = await supabase
        .from("academias")
        .select("id", { count: 'exact', head: true })
        .eq("email", data.email);

      if (emailError) {
        console.error("Erro ao verificar email:", emailError);
        throw emailError;
      }

      if (emailCount && emailCount > 0) {
        console.log("Email já registrado:", data.email);
        toast({
          variant: "destructive",
          title: "Email já cadastrado",
          description: "Este email já está sendo usado por outra academia. Por favor, utilize outro email.",
        });
        return;
      }

      // 2. Verificar se o CNPJ já existe
      console.log("Verificando existência do CNPJ:", data.cnpj);
      const { count: cnpjCount, error: cnpjError } = await supabase
        .from("academias")
        .select("id", { count: 'exact', head: true })
        .eq("cnpj", data.cnpj.replace(/\D/g, ""));

      if (cnpjError) {
        console.error("Erro ao verificar CNPJ:", cnpjError);
        throw cnpjError;
      }

      if (cnpjCount && cnpjCount > 0) {
        console.log("CNPJ já registrado:", data.cnpj);
        toast({
          variant: "destructive",
          title: "CNPJ já cadastrado",
          description: "Este CNPJ já está registrado no sistema. Cada academia deve ter um CNPJ único.",
        });
        return;
      }

      // 3. Se passou por todas as verificações, registrar a academia
      console.log("Iniciando registro da academia...");
      const academia = await registerGym(data);

      console.log("Academia registrada com sucesso:", academia);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua academia foi cadastrada e você será redirecionado para o painel.",
      });

      navigate(`/academia/${academia.id}`);
    } catch (error: any) {
      console.error("Erro detalhado durante o cadastro:", error);
      
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro inesperado. Por favor, tente novamente.",
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