import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cnpj } from "cpf-cnpj-validator";
import { CepInput } from "@/components/shared/CepInput";
import { Separator } from "@/components/ui/separator";

interface GymDataFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue?: UseFormSetValue<any>;
  watch?: any;
}

export function GymDataForm({ register, errors, setValue, watch }: GymDataFormProps) {
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

      <Separator className="my-4" />
      <h3 className="text-lg font-semibold mb-2">Endereço</h3>
      
      {/* CEP e Endereço detalhado, mobile first, nomes padronizados */}
      {setValue && (
        <CepInput 
          register={register} 
          errors={errors} 
          setValue={setValue} 
          label="CEP" 
          required={true} 
        />
      )}
      {watch && watch('cep_loading') && (
        <div className="text-sm text-blue-500 mt-2 mb-4">Buscando endereço...</div>
      )}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label htmlFor="endereco">Endereço (Rua)</Label>
          <Input
            id="endereco"
            {...register("endereco", { required: "Endereço é obrigatório" })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            autoComplete="address-line1"
          />
          {errors.endereco && (
            <p className="text-sm text-red-500">{errors.endereco.message as string}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="numero">Número</Label>
            <Input
              id="numero"
              {...register("numero", { required: "Número é obrigatório" })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              autoComplete="address-line2"
            />
            {errors.numero && (
              <p className="text-sm text-red-500">{errors.numero.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              {...register("complemento")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              autoComplete="address-line3"
              placeholder="Apartamento, bloco, etc."
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            {...register("bairro", { required: "Bairro é obrigatório" })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            autoComplete="address-level2"
          />
          {errors.bairro && (
            <p className="text-sm text-red-500">{errors.bairro.message as string}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              {...register("cidade", { required: "Cidade é obrigatória" })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              autoComplete="address-level3"
            />
            {errors.cidade && (
              <p className="text-sm text-red-500">{errors.cidade.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              {...register("estado", { required: "Estado é obrigatório" })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              autoComplete="address-level1"
            />
            {errors.estado && (
              <p className="text-sm text-red-500">{errors.estado.message as string}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}