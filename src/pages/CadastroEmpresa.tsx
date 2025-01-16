import { useState } from "react";
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

      // Registrar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
        throw new Error("Erro ao criar usuário");
      }

      // Criar perfil da empresa com todos os campos obrigatórios
      const { error: profileError } = await supabase.from("business_profiles").insert({
        user_id: authData.user.id,
        company_name: data.company_name,
        trading_name: data.trading_name,
        cnpj: data.cnpj.replace(/\D/g, ""),
        email: data.email,
        inscricao_estadual: data.inscricao_estadual,
        // Campos obrigatórios adicionados com valores padrão
        // Estes serão atualizados nas próximas etapas do cadastro
        address: "A ser preenchido",
        phone: "A ser preenchido",
        number_of_employees: 1,
        contact_person: "A ser preenchido",
        contact_position: "A ser preenchido",
        contact_phone: "A ser preenchido",
        contact_email: data.email, // Usando o mesmo email corporativo inicialmente
        status: "pending"
      });

      if (profileError) throw profileError;

      toast({
        title: "Cadastro iniciado com sucesso!",
        description: "Continue o cadastro preenchendo as informações adicionais.",
      });

      // Redirecionar para a próxima etapa do cadastro
      navigate("/cadastro-empresa/endereco");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao realizar cadastro",
        description: error.message || "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
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