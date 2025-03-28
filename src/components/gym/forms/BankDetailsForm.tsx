
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BankDetailsFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function BankDetailsForm({ register, errors }: BankDetailsFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dados Bancários</h3>
      
      <div>
        <Label htmlFor="titular_tipo">Tipo de Titular</Label>
        <Select onValueChange={(value) => register("titular_tipo").onChange({ target: { value } })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de titular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PF">Pessoa Física</SelectItem>
            <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
          </SelectContent>
        </Select>
        {errors.titular_tipo && (
          <p className="text-sm text-red-500">{errors.titular_tipo.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="titular_nome">Nome do Titular</Label>
        <Input
          id="titular_nome"
          {...register("titular_nome", { required: "Nome do titular é obrigatório" })}
        />
        {errors.titular_nome && (
          <p className="text-sm text-red-500">{errors.titular_nome.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="titular_cpf_cnpj">CPF/CNPJ do Titular</Label>
        <Input
          id="titular_cpf_cnpj"
          {...register("titular_cpf_cnpj", { required: "CPF/CNPJ é obrigatório" })}
        />
        {errors.titular_cpf_cnpj && (
          <p className="text-sm text-red-500">{errors.titular_cpf_cnpj.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="metodo_preferencial">Método Preferencial de Recebimento</Label>
        <Select onValueChange={(value) => register("metodo_preferencial").onChange({ target: { value } })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o método preferencial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PIX">PIX</SelectItem>
            <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
          </SelectContent>
        </Select>
        {errors.metodo_preferencial && (
          <p className="text-sm text-red-500">{errors.metodo_preferencial.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="tipo_chave_pix">Tipo de Chave PIX</Label>
        <Select onValueChange={(value) => register("tipo_chave_pix").onChange({ target: { value } })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de chave PIX" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CPF">CPF</SelectItem>
            <SelectItem value="CNPJ">CNPJ</SelectItem>
            <SelectItem value="EMAIL">E-mail</SelectItem>
            <SelectItem value="TELEFONE">Telefone</SelectItem>
            <SelectItem value="ALEATORIA">Chave Aleatória</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="chave_pix">Chave PIX</Label>
        <Input id="chave_pix" {...register("chave_pix")} />
      </div>

      <div className="space-y-4 border-t pt-4 mt-4">
        <h4 className="font-medium">Dados Bancários (Para Transferência)</h4>
        
        <div>
          <Label htmlFor="banco_codigo">Código do Banco</Label>
          <Input id="banco_codigo" {...register("banco_codigo")} />
        </div>

        <div>
          <Label htmlFor="banco_nome">Nome do Banco</Label>
          <Input id="banco_nome" {...register("banco_nome")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="agencia">Agência</Label>
            <Input id="agencia" {...register("agencia")} />
          </div>
          <div>
            <Label htmlFor="agencia_digito">Dígito</Label>
            <Input id="agencia_digito" {...register("agencia_digito")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="conta">Conta</Label>
            <Input id="conta" {...register("conta")} />
          </div>
          <div>
            <Label htmlFor="conta_digito">Dígito</Label>
            <Input id="conta_digito" {...register("conta_digito")} />
          </div>
        </div>

        <div>
          <Label htmlFor="tipo_conta">Tipo de Conta</Label>
          <Select onValueChange={(value) => register("tipo_conta").onChange({ target: { value } })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corrente">Conta Corrente</SelectItem>
              <SelectItem value="poupanca">Conta Poupança</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
