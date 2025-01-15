import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cnpj } from "cpf-cnpj-validator";

interface BusinessFormData {
  company_name: string;
  cnpj: string;
  trading_name?: string;
  phone: string;
  email: string;
  address: string;
  number_of_employees: number;
  industry?: string;
  contact_person: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
}

export default function CadastroEmpresa() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>();

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2");
  };

  const onSubmit = async (data: BusinessFormData) => {
    try {
      setIsSubmitting(true);

      // Registrar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: "senha123", // Senha temporária - você pode implementar um campo de senha no formulário
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
        throw new Error("Erro ao criar usuário");
      }

      // Criar perfil da empresa
      const { error: profileError } = await supabase.from("business_profiles").insert({
        user_id: authData.user.id,
        company_name: data.company_name,
        cnpj: data.cnpj.replace(/\D/g, ""),
        trading_name: data.trading_name,
        phone: data.phone.replace(/\D/g, ""),
        email: data.email,
        address: data.address,
        number_of_employees: data.number_of_employees,
        industry: data.industry,
        contact_person: data.contact_person,
        contact_position: data.contact_position,
        contact_phone: data.contact_phone.replace(/\D/g, ""),
        contact_email: data.contact_email,
      });

      if (profileError) throw profileError;

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar o cadastro.",
      });

      navigate("/");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Cadastro de Empresa
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company_name">Razão Social</Label>
                <Input
                  id="company_name"
                  {...register("company_name", {
                    required: "Razão social é obrigatória",
                    minLength: {
                      value: 3,
                      message: "Razão social deve ter no mínimo 3 caracteres",
                    },
                  })}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.company_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  {...register("cnpj", {
                    required: "CNPJ é obrigatório",
                    validate: (value) => cnpj.isValid(value) || "CNPJ inválido",
                  })}
                  onChange={(e) => {
                    e.target.value = formatCNPJ(e.target.value);
                  }}
                  maxLength={18}
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-500 mt-1">{errors.cnpj.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="trading_name">Nome Fantasia</Label>
                <Input id="trading_name" {...register("trading_name")} />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register("phone", {
                    required: "Telefone é obrigatório",
                    minLength: {
                      value: 14,
                      message: "Telefone inválido",
                    },
                  })}
                  onChange={(e) => {
                    e.target.value = formatPhone(e.target.value);
                  }}
                  maxLength={15}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "E-mail é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "E-mail inválido",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...register("address", {
                    required: "Endereço é obrigatório",
                  })}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="number_of_employees">Número de Funcionários</Label>
                <Input
                  id="number_of_employees"
                  type="number"
                  {...register("number_of_employees", {
                    required: "Número de funcionários é obrigatório",
                    min: {
                      value: 1,
                      message: "Deve ter pelo menos 1 funcionário",
                    },
                  })}
                />
                {errors.number_of_employees && (
                  <p className="text-sm text-red-500 mt-1">{errors.number_of_employees.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="industry">Setor de Atuação</Label>
                <Input id="industry" {...register("industry")} />
              </div>

              <div>
                <Label htmlFor="contact_person">Nome do Responsável</Label>
                <Input
                  id="contact_person"
                  {...register("contact_person", {
                    required: "Nome do responsável é obrigatório",
                  })}
                />
                {errors.contact_person && (
                  <p className="text-sm text-red-500 mt-1">{errors.contact_person.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contact_position">Cargo do Responsável</Label>
                <Input
                  id="contact_position"
                  {...register("contact_position", {
                    required: "Cargo do responsável é obrigatório",
                  })}
                />
                {errors.contact_position && (
                  <p className="text-sm text-red-500 mt-1">{errors.contact_position.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contact_phone">Telefone do Responsável</Label>
                <Input
                  id="contact_phone"
                  {...register("contact_phone", {
                    required: "Telefone do responsável é obrigatório",
                    minLength: {
                      value: 14,
                      message: "Telefone inválido",
                    },
                  })}
                  onChange={(e) => {
                    e.target.value = formatPhone(e.target.value);
                  }}
                  maxLength={15}
                />
                {errors.contact_phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.contact_phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contact_email">E-mail do Responsável</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register("contact_email", {
                    required: "E-mail do responsável é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "E-mail inválido",
                    },
                  })}
                />
                {errors.contact_email && (
                  <p className="text-sm text-red-500 mt-1">{errors.contact_email.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0125F0] hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}