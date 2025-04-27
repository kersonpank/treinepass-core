
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { CepInput } from "@/components/shared/CepInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Phone, Mail, MapPin } from "lucide-react";

interface BasicInfoTabProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function BasicInfoTab({ register, errors }: BasicInfoTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nome" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Nome da Academia
        </Label>
        <Input
          id="nome"
          {...register("nome", { required: "Nome é obrigatório" })}
        />
        {errors.nome && (
          <p className="text-sm text-red-500">{errors.nome.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="telefone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Telefone
        </Label>
        <Input
          id="telefone"
          {...register("telefone", { required: "Telefone é obrigatório" })}
        />
        {errors.telefone && (
          <p className="text-sm text-red-500">{errors.telefone.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          E-mail
        </Label>
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

      {/* CEP + Endereço detalhado, mobile first */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="col-span-1">
          <CepInput
            register={register}
            errors={errors}
            setValue={setValue}
            label="CEP"
            required={true}
          />
        </div>
        <div className="col-span-1">
          <Label htmlFor="street">Rua</Label>
          <Input id="street" {...register("street", { required: "Rua é obrigatória" })} />
          {errors.street && <p className="text-sm text-red-500">{errors.street.message as string}</p>}
        </div>
        <div className="col-span-1">
          <Label htmlFor="number">Número</Label>
          <Input id="number" {...register("number", { required: "Número é obrigatório" })} />
          {errors.number && <p className="text-sm text-red-500">{errors.number.message as string}</p>}
        </div>
        <div className="col-span-1">
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" {...register("complement")} />
        </div>
        <div className="col-span-1">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" {...register("neighborhood", { required: "Bairro é obrigatório" })} />
          {errors.neighborhood && <p className="text-sm text-red-500">{errors.neighborhood.message as string}</p>}
        </div>
        <div className="col-span-1">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" {...register("city", { required: "Cidade é obrigatória" })} />
          {errors.city && <p className="text-sm text-red-500">{errors.city.message as string}</p>}
        </div>
        <div className="col-span-1">
          <Label htmlFor="state">Estado</Label>
          <Input id="state" {...register("state", { required: "Estado é obrigatório" })} />
          {errors.state && <p className="text-sm text-red-500">{errors.state.message as string}</p>}
        </div>
      </div>
    </div>
  );
}
