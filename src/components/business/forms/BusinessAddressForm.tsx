import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CepInput } from "@/components/shared/CepInput";

interface BusinessAddressFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue: UseFormSetValue<any>;
  watch?: UseFormWatch<any>;
}

export function BusinessAddressForm({ register, errors, setValue, watch }: BusinessAddressFormProps) {
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          // Atualizar os campos usando setValue
          setValue('street', data.logradouro, { shouldValidate: true });
          setValue('neighborhood', data.bairro, { shouldValidate: true });
          setValue('city', data.localidade, { shouldValidate: true });
          setValue('state', data.uf, { shouldValidate: true });
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <CepInput
        register={register}
        errors={errors}
        setValue={setValue}
        label="CEP"
        required={true}
      />
      
      {watch && watch('cep_loading') && (
        <div className="text-sm text-blue-500 mt-2 mb-4">
          Buscando endereço...
        </div>
      )}

      <div>
        <Label htmlFor="street">Rua</Label>
        <Input
          id="street"
          {...register("street", { required: "Rua é obrigatória" })}
        />
        {errors.street && (
          <p className="text-sm text-red-500 mt-1">{errors.street.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="number">Número</Label>
        <Input
          id="number"
          {...register("number", { required: "Número é obrigatório" })}
        />
        {errors.number && (
          <p className="text-sm text-red-500 mt-1">{errors.number.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="complement">Complemento</Label>
        <Input
          id="complement"
          {...register("complement")}
        />
      </div>

      <div>
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          {...register("neighborhood", { required: "Bairro é obrigatório" })}
        />
        {errors.neighborhood && (
          <p className="text-sm text-red-500 mt-1">{errors.neighborhood.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="city">Cidade</Label>
        <Input
          id="city"
          {...register("city", { required: "Cidade é obrigatória" })}
        />
        {errors.city && (
          <p className="text-sm text-red-500 mt-1">{errors.city.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="state">Estado</Label>
        <Input
          id="state"
          {...register("state", { required: "Estado é obrigatório" })}
        />
        {errors.state && (
          <p className="text-sm text-red-500 mt-1">{errors.state.message as string}</p>
        )}
      </div>
    </div>
  );
}