
import { UseFormRegister, FieldErrors } from "react-hook-form";
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

      <div>
        <Label htmlFor="endereco" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Endereço
        </Label>
        <Textarea
          id="endereco"
          {...register("endereco", { required: "Endereço é obrigatório" })}
        />
        {errors.endereco && (
          <p className="text-sm text-red-500">{errors.endereco.message as string}</p>
        )}
      </div>
    </div>
  );
}
