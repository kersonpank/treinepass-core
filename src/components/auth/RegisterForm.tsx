
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
      // Format phone number before submission (remove any non-digit characters)
      const formattedData = {
        ...data,
        phone_number: data.phone_number.replace(/\D/g, '')
      };
      
      await onSubmit(formattedData);
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

  const formatPhoneNumber = (value: string) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as (XX) XXXXX-XXXX
    if (digits.length <= 11) {
      return digits.replace(/(\d{2})?(\d{5})?(\d{4})?/, (_, p1, p2, p3) => {
        let formatted = '';
        if (p1) formatted += `(${p1}`;
        if (p2) formatted += `) ${p2}`;
        if (p3) formatted += `-${p3}`;
        return formatted;
      });
    }
    return value;
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
        <Label htmlFor="phone_number">WhatsApp/Celular</Label>
        <Input
          id="phone_number"
          type="tel"
          placeholder="(11) 99999-9999"
          {...register("phone_number", {
            required: "Número de celular é obrigatório",
            pattern: {
              value: /^\(\d{2}\)\s\d{5}-\d{4}$/,
              message: "Formato inválido. Use: (11) 99999-9999",
            },
            onChange: (e) => {
              e.target.value = formatPhoneNumber(e.target.value);
            },
          })}
        />
        {errors.phone_number && (
          <p className="text-sm text-red-500 mt-1">{errors.phone_number.message}</p>
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
