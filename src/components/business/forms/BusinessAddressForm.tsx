import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BusinessAddressFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function BusinessAddressForm({ register, errors }: BusinessAddressFormProps) {
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          const addressInputs = document.querySelectorAll('input');
          addressInputs.forEach((input) => {
            if (input.id === 'street') input.value = data.logradouro;
            if (input.id === 'neighborhood') input.value = data.bairro;
            if (input.id === 'city') input.value = data.localidade;
            if (input.id === 'state') input.value = data.uf;
          });
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cep">CEP</Label>
        <Input
          id="cep"
          {...register("cep", {
            required: "CEP é obrigatório",
            pattern: {
              value: /^\d{5}-?\d{3}$/,
              message: "CEP inválido",
            },
          })}
          onBlur={handleCepBlur}
          placeholder="00000-000"
        />
        {errors.cep && (
          <p className="text-sm text-red-500 mt-1">{errors.cep.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="street">Rua</Label>
        <Input
          id="street"
          {...register("street", {
            required: "Rua é obrigatória",
          })}
        />
        {errors.street && (
          <p className="text-sm text-red-500 mt-1">{errors.street.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="number">Número</Label>
        <Input
          id="number"
          {...register("number", {
            required: "Número é obrigatório",
          })}
        />
        {errors.number && (
          <p className="text-sm text-red-500 mt-1">{errors.number.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="complement">Complemento (opcional)</Label>
        <Input
          id="complement"
          {...register("complement")}
        />
      </div>

      <div>
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          {...register("neighborhood", {
            required: "Bairro é obrigatório",
          })}
        />
        {errors.neighborhood && (
          <p className="text-sm text-red-500 mt-1">{errors.neighborhood.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="city">Cidade</Label>
        <Input
          id="city"
          {...register("city", {
            required: "Cidade é obrigatória",
          })}
        />
        {errors.city && (
          <p className="text-sm text-red-500 mt-1">{errors.city.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="state">Estado</Label>
        <Input
          id="state"
          {...register("state", {
            required: "Estado é obrigatório",
          })}
        />
        {errors.state && (
          <p className="text-sm text-red-500 mt-1">{errors.state.message as string}</p>
        )}
      </div>
    </div>
  );
}