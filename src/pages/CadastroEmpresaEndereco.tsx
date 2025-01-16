import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { BusinessAddressForm } from "@/components/business/forms/BusinessAddressForm";

interface AddressFormData {
  cep: string;
  street: string;
  number: string;
  complement?: string;
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
  } = useForm<AddressFormData>();

  const onSubmit = async (data: AddressFormData) => {
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

      const formattedAddress = `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ''}, ${data.neighborhood}, ${data.city} - ${data.state}, CEP: ${data.cep}`;

      const { error: updateError } = await supabase
        .from("business_profiles")
        .update({
          address: formattedAddress,
        })
        .eq("id", businessProfile.id);

      console.log("Update result:", updateError);

      if (updateError) throw updateError;

      toast({
        title: "Endereço cadastrado com sucesso!",
        description: "Você será redirecionado para o painel da empresa.",
      });

      // Redirect to the business dashboard
      navigate("/dashboard-empresa");
    } catch (error: any) {
      console.error("Error during address registration:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar endereço",
        description: error.message || "Ocorreu um erro ao salvar os dados. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Endereço da Empresa" 
      subtitle="Preencha o endereço da sua empresa"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <BusinessAddressForm
          register={register}
          errors={errors}
        />

        <Button
          type="submit"
          className="w-full bg-[#0125F0] hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Continuar"}
        </Button>
      </form>
    </AuthLayout>
  );
}