import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserDataFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function UserDataForm({ register, errors }: UserDataFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dados do Responsável</h3>
      
      <div>
        <Label htmlFor="full_name">Nome Completo</Label>
        <Input
          id="full_name"
          {...register("full_name", { 
            required: "Nome é obrigatório",
            minLength: {
              value: 3,
              message: "Nome deve ter pelo menos 3 caracteres"
            }
          })}
        />
        {errors.full_name && (
          <p className="text-sm text-red-500">{errors.full_name.message as string}</p>
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
          <p className="text-sm text-red-500">{errors.email.message as string}</p>
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
              message: "Senha deve ter pelo menos 6 caracteres"
            }
          })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message as string}</p>
        )}
      </div>
    </div>
  );
}