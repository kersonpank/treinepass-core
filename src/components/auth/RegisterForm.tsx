
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CPFInput } from "./form/CPFInput";
import { DateInput } from "./form/DateInput";
import { UserFormData } from "./types/auth";

interface RegisterFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RegisterForm({ onSubmit, isSubmitting }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormData>();

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error?.message?.includes("CPF já cadastrado")) {
        setError("cpf", {
          type: "manual",
          message: "Este CPF já está cadastrado",
        });
      } else {
        throw error;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
        <Label htmlFor="phone_number">Celular</Label>
        <Input
          id="phone_number"
          type="tel"
          placeholder="DDD + Número (Ex: 11912345678)"
          {...register("phone_number", {
            required: "Celular é obrigatório",
            pattern: {
              value: /^[1-9]{2}9[0-9]{8}$/,
              message: "Formato inválido. Use apenas números, ex: 11912345678",
            },
          })}
        />
        {errors.phone_number && (
          <p className="text-sm text-red-500 mt-1">{errors.phone_number.message}</p>
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

      <CPFInput register={register} errors={errors} />
      <DateInput register={register} errors={errors} />

      <Button
        type="submit"
        className="w-full bg-[#0125F0] hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Cadastrando..." : "Cadastrar"}
      </Button>

      <p className="text-sm text-gray-500 text-center mt-4">
        Após o cadastro, você receberá um e-mail de confirmação.
        Por favor, verifique sua caixa de entrada.
      </p>
    </form>
  );
}
