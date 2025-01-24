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
    setError,
    formState: { errors },
    watch,
  } = useForm<UserFormData>();

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatDate = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})\d+?$/, "$1");
  };

  const validateBirthDate = (value: string) => {
    if (!value) return "Data de nascimento é obrigatória";
    
    const [day, month, year] = value.split("/").map(Number);
    if (!day || !month || !year) return "Data inválida";
    
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Check if date is valid
    if (
      isNaN(birthDate.getTime()) || 
      birthDate > today ||
      day > 31 || month > 12
    ) {
      return "Data inválida";
    }
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 16 || "Você deve ter pelo menos 16 anos";
  };

  const handleFormSubmit = async (data: UserFormData) => {
    console.log("Form data before submission:", data);
    
    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error?.message?.includes("User already registered") || 
          error?.message?.includes("user_already_exists")) {
        setError("email", {
          type: "manual",
          message: "Este e-mail já está cadastrado",
        });
      } else if (error?.message?.includes("CPF já cadastrado")) {
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
          placeholder="DD/MM/AAAA"
          {...register("birth_date", {
            required: "Data de nascimento é obrigatória",
            validate: validateBirthDate,
          })}
          onChange={(e) => {
            e.target.value = formatDate(e.target.value);
          }}
          maxLength={10}
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

      <p className="text-sm text-gray-500 text-center mt-4">
        Após o cadastro, você receberá um e-mail de confirmação.
        Por favor, verifique sua caixa de entrada.
      </p>
    </form>
  );
}