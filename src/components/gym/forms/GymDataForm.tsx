import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cnpj } from "cpf-cnpj-validator";

interface GymDataFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function GymDataForm({ register, errors }: GymDataFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dados da Academia</h3>
      
      <div>
        <Label htmlFor="nome">Nome da Academia</Label>
        <Input
          id="nome"
          {...register("nome", { required: "Nome é obrigatório" })}
        />
        {errors.nome && (
          <p className="text-sm text-red-500">{errors.nome.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          {...register("cnpj", {
            required: "CNPJ é obrigatório",
            validate: (value) => cnpj.isValid(value) || "CNPJ inválido",
          })}
        />
        {errors.cnpj && (
          <p className="text-sm text-red-500">{errors.cnpj.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          {...register("telefone", { required: "Telefone é obrigatório" })}
        />
        {errors.telefone && (
          <p className="text-sm text-red-500">{errors.telefone.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="endereco">Endereço</Label>
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