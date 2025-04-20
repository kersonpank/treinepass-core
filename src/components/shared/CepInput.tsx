import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue, Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CepInputProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue: UseFormSetValue<any>;
  label?: string;
  required?: boolean;
}

export function CepInput({ 
  register, 
  errors, 
  setValue, 
  label = "CEP", 
  required = true 
}: CepInputProps) {
  const formatCep = (value: string) => {
    // Remove todos os caracteres não numéricos
    const digits = value.replace(/\D/g, "");
    
    // Formata como 00000-000
    if (digits.length <= 5) {
      return digits;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
    }
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      alert('CEP inválido. O CEP deve ter 8 dígitos.');
      setValue('cep', '', { shouldValidate: true });
      return;
    }
    try {
      setValue('cep_loading', true, { shouldValidate: false });
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      let missingFields: string[] = [];
      if (!data.erro) {
        // Rua/Endereço
        if (data.logradouro) setValue('street', data.logradouro, { shouldValidate: true });
        else missingFields.push('rua');
        // Bairro
        if (data.bairro) setValue('neighborhood', data.bairro, { shouldValidate: true });
        else missingFields.push('bairro');
        // Cidade
        if (data.localidade) setValue('city', data.localidade, { shouldValidate: true });
        else missingFields.push('cidade');
        // Estado
        if (data.uf) setValue('state', data.uf, { shouldValidate: true });
        else missingFields.push('estado');
        // CEP
        setValue('cep', cep, { shouldValidate: true });
        // Exibir aviso se algum campo essencial não foi preenchido pela API
        if (missingFields.length > 0) {
          alert(`Não foi possível preencher automaticamente os seguintes campos: ${missingFields.join(', ')}.\nPor favor, preencha manualmente.`);
        }
      } else {
        alert('CEP não encontrado. Por favor, preencha o endereço manualmente.');
        setValue('cep', '', { shouldValidate: true });
      }
    } catch (error) {
      alert('Erro ao buscar CEP. Por favor, preencha o endereço manualmente.');
      setValue('cep', '', { shouldValidate: true });
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setValue('cep_loading', false, { shouldValidate: false });
    }
  };

  return (
    <div>
      <Label htmlFor="cep">{label}</Label>
      <Input
        id="cep"
        {...register("cep", {
          required: required ? "CEP é obrigatório" : false,
          pattern: {
            value: /^\d{5}-?\d{3}$/,
            message: "CEP inválido",
          },
        })}
        placeholder="00000-000"
        onChange={(e) => {
          const formattedValue = formatCep(e.target.value);
          e.target.value = formattedValue;
          setValue("cep", formattedValue, { shouldValidate: true });
        }}
        onBlur={handleCepBlur}
        maxLength={9}
      />
      {errors.cep && (
        <p className="text-sm text-red-500 mt-1">{errors.cep.message as string}</p>
      )}
    </div>
  );
}
