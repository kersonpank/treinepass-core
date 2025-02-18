import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { BusinessAddressForm } from "@/components/business/forms/BusinessAddressForm";

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export default function CadastroEmpresaEndereco() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<AddressData>();

  const onSubmit = async (data: AddressData) => {
    console.log("Starting address submission:", data);
    try {
      setIsSubmitting(true);

      const { data: session } = await supabase.auth.getSession();
      console.log("Current session:", session);

      if (!session?.session?.user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data: businessProfile, error: profileError } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", session.session.user.id)
        .single();

      console.log("Business profile:", businessProfile, "Error:", profileError);

      if (profileError || !businessProfile) {
        throw new Error("Perfil da empresa não encontrado");
      }

      // Atualizar o endereço da empresa
      const { error: addressError } = await supabase
        .from("business_profiles")
        .update({
          address: {
            cep: data.cep,
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state
          }
        })
        .eq("id", businessProfile.id);

      if (addressError) {
        throw addressError;
      }

      toast({
        title: "Endereço cadastrado com sucesso!",
        description: "Você será redirecionado para a área da empresa.",
      });

      setTimeout(() => {
        navigate("/dashboard-empresa");
      }, 2000);

    } catch (error: any) {
      console.error("Error submitting address:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar endereço",
        description: error.message || "Ocorreu um erro inesperado"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Cadastro de Endereço"
      description="Complete o cadastro da sua empresa informando o endereço"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <BusinessAddressForm 
          register={register} 
          errors={errors} 
          setValue={setValue}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="mr-2">Cadastrando...</span>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
            </>
          ) : (
            "Finalizar Cadastro"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
