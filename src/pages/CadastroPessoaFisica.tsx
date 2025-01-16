import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { registerUser } from "@/services/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function CadastroPessoaFisica() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    console.log("Starting form submission...", { formData: data });
    try {
      setIsSubmitting(true);
      console.log("Calling registerUser service...");
      await registerUser(data);
      
      console.log("Registration successful, showing success toast");
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao TreinePass",
      });

      console.log("Redirecting to app...");
      navigate("/app");
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        error
      });
      
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
      title="Cadastro de Usuário"
      subtitle="Crie sua conta para começar a usar o TreinePass"
    >
      <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </AuthLayout>
  );
}