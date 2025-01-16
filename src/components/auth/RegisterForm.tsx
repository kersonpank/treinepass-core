import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cpf } from "cpf-cnpj-validator";

interface UserFormData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  birth_date: string;
}

interface RegisterFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RegisterForm({ onSubmit, isSubmitting }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>();

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="full_name">Nome Completo</Label>
        <Input
          id="full_name"
          {...register("full_name", {
            required: "Nome é obrigatório",
            minLength: {
              value: 3,
              message: "Nome deve ter no mínimo 3 caracteres",
            },
          })}
        />
        {errors.full_name && (
          <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
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
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          {...register("password", {
            required: "Senha é obrigatória",
            minLength: {
              value: 6,
              message: "Senha deve ter no mínimo 6 caracteres",
            },
          })}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          {...register("cpf", {
            required: "CPF é obrigatório",
            validate: (value) => cpf.isValid(value) || "CPF inválido",
          })}
          onChange={(e) => {
            e.target.value = formatCPF(e.target.value);
          }}
          maxLength={14}
        />
        {errors.cpf && (
          <p className="text-sm text-red-500 mt-1">{errors.cpf.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="birth_date">Data de Nascimento</Label>
        <Input
          id="birth_date"
          type="date"
          {...register("birth_date", {
            required: "Data de nascimento é obrigatória",
            validate: (value) => {
              const birthDate = new Date(value);
              const today = new Date();
              const age = today.getFullYear() - birthDate.getFullYear();
              return age >= 18 || "Você deve ter pelo menos 18 anos";
            },
          })}
        />
        {errors.birth_date && (
          <p className="text-sm text-red-500 mt-1">{errors.birth_date.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#0125F0] hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
}