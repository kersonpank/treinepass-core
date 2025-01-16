import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { registerUser } from "@/services/auth";

export default function CadastroPessoaFisica() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await registerUser(data);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao TreinePass",
      });

      navigate("/app");
    } catch (error: any) {
      console.error("Error details:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Cadastro de Usuário
          </h1>
          <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </div>
    </div>
  );
}