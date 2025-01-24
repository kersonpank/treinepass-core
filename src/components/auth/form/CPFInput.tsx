import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { cpf } from "cpf-cnpj-validator";
import { UserFormData } from "../types/auth";

interface CPFInputProps {
  register: UseFormRegister<UserFormData>;
  errors: FieldErrors<UserFormData>;
}

export const CPFInput = ({ register, errors }: CPFInputProps) => {
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  return (
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
  );
};