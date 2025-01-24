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
    // Remove any non-digit characters
    const cleaned = value.replace(/\D/g, "");
    
    // Format as DD/MM/YYYY
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5, 9);
    
    return formatted;
  };

  const validateBirthDate = (value: string) => {
    console.log("Validating birth date:", value);
    
    if (!value) {
      return "Data de nascimento é obrigatória";
    }

    // Remove any whitespace
    const cleanValue = value.trim();
    console.log("Cleaned value:", cleanValue);

    // Check format DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cleanValue)) {
      console.log("Invalid format");
      return "Data inválida";
    }

    const [day, month, year] = cleanValue.split("/").map(Number);
    console.log("Parsed values:", { day, month, year });

    // Create date object (month - 1 because months are 0-indexed)
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    // Check if date is valid
    if (
      isNaN(birthDate.getTime()) || // Invalid date
      birthDate > today || // Future date
      day > 31 || month > 12 || // Invalid day/month
      day <= 0 || month <= 0 || year <= 0 || // Zero or negative values
      birthDate.getDate() !== day || // Day overflow (e.g., 31/04/2000)
      birthDate.getMonth() !== month - 1 // Month overflow
    ) {
      console.log("Invalid date components");
      return "Data inválida";
    }

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    console.log("Calculated age:", age);

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
          onChange: (e) => {
            e.target.value = formatDate(e.target.value);
          }
        })}
        maxLength={10}
      />
      {errors.birth_date && (
        <p className="text-sm text-red-500 mt-1">{errors.birth_date.message}</p>
      )}
    </div>
  );
};