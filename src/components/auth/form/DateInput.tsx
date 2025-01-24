import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { UserFormData } from "../types/auth";

interface DateInputProps {
  register: UseFormRegister<UserFormData>;
  errors: FieldErrors<UserFormData>;
}

export const DateInput = ({ register, errors }: DateInputProps) => {
  const formatDate = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})\d+?$/, "$1");
  };

  const validateBirthDate = (value: string) => {
    if (!value || value.trim() === "") {
      return "Data de nascimento é obrigatória";
    }

    const cleanValue = value.trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cleanValue)) {
      return "Data inválida";
    }

    const [day, month, year] = cleanValue.split("/").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    if (
      isNaN(birthDate.getTime()) ||
      birthDate > today ||
      day > 31 || month > 12 ||
      day <= 0 || month <= 0 || year <= 0
    ) {
      return "Data inválida";
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      return "Você deve ter pelo menos 16 anos";
    }

    return true;
  };

  return (
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
  );
};