import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { BusinessDataForm } from "@/components/business/forms/BusinessDataForm";

interface BusinessFormData {
  company_name: string;
  trading_name: string;
  cnpj: string;
  inscricao_estadual?: string;
  email: string;
  password: string;
}

export default function CadastroEmpresa() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BusinessFormData>();

  const onSubmit = async (data: BusinessFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Iniciando cadastro de empresa:", { email: data.email });

      // Criar usuário no auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            company_name: data.company_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user?.id) {
        throw new Error("Erro ao criar usuário");
      }

      console.log("Usuário criado com sucesso:", { userId: authData.user.id });

      // Criar perfil da empresa
      const { error: profileError } = await supabase.from("business_profiles").insert({
        user_id: authData.user.id,
        company_name: data.company_name,
        trading_name: data.trading_name,
        cnpj: data.cnpj.replace(/\D/g, ""),
        email: data.email,
        inscricao_estadual: data.inscricao_estadual,
        // Campos obrigatórios com valores padrão
        address: "A ser preenchido",
        phone: "A ser preenchido",
        number_of_employees: 1,
        contact_person: "A ser preenchido",
        contact_position: "A ser preenchido",
        contact_phone: "A ser preenchido",
        contact_email: data.email,
        status: "pending"
      });

      if (profileError) throw profileError;

      console.log("Perfil da empresa criado com sucesso");

      // Login automático após o cadastro
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Continue o cadastro preenchendo as informações adicionais.",
      });

      // Redirecionar para a próxima etapa
      navigate("/cadastro-empresa/endereco");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast({
        variant: "destructive",
        title: "Erro ao realizar cadastro",
        description: error.message || "Ocorreu um erro ao salvar os dados. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Cadastro de Empresa" 
      subtitle="Preencha os dados principais da sua empresa"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <BusinessDataForm
          register={register}
          errors={errors}
          watch={watch}
        />

        <Button
          type="submit"
          className="w-full bg-[#0125F0] hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Cadastrando..." : "Continuar"}
        </Button>
      </form>
    </AuthLayout>
  );
}