
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BankDataFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  className?: string;
}

type PaymentMethod = "PIX" | "TRANSFERENCIA";
type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "CELULAR" | "ALEATORIA";
type HolderType = "PF" | "PJ";
type AccountType = "CORRENTE" | "POUPANCA";

export function BankDataForm({ initialData, onSubmit, className }: BankDataFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.metodo_preferencial || "PIX");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: initialData || {
      metodo_preferencial: "PIX",
      titular_tipo: "PF",
      tipo_conta: "CORRENTE"
    }
  });

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Dados Bancários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Método de Pagamento Preferencial */}
          <div className="space-y-2">
            <Label>Método Preferencial de Recebimento</Label>
            <RadioGroup
              defaultValue={paymentMethod}
              onValueChange={(value: PaymentMethod) => {
                setPaymentMethod(value);
                setValue("metodo_preferencial", value);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PIX" id="pix" />
                <Label htmlFor="pix">PIX</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TRANSFERENCIA" id="transferencia" />
                <Label htmlFor="transferencia">Transferência Bancária</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dados do Titular */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados do Titular</h3>
            
            <div>
              <Label htmlFor="titular_tipo">Tipo de Titular</Label>
              <Select
                onValueChange={(value: HolderType) => setValue("titular_tipo", value)}
                defaultValue={watch("titular_tipo")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de titular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="titular_nome">Nome do Titular</Label>
              <Input
                id="titular_nome"
                {...register("titular_nome", { required: "Nome do titular é obrigatório" })}
              />
              {errors.titular_nome && (
                <p className="text-sm text-red-500 mt-1">{errors.titular_nome.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="titular_cpf_cnpj">CPF/CNPJ do Titular</Label>
              <Input
                id="titular_cpf_cnpj"
                {...register("titular_cpf_cnpj", { required: "CPF/CNPJ é obrigatório" })}
              />
              {errors.titular_cpf_cnpj && (
                <p className="text-sm text-red-500 mt-1">{errors.titular_cpf_cnpj.message as string}</p>
              )}
            </div>
          </div>

          {/* Dados PIX */}
          {paymentMethod === "PIX" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados do PIX</h3>
              
              <div>
                <Label htmlFor="tipo_chave_pix">Tipo de Chave PIX</Label>
                <Select
                  onValueChange={(value: PixKeyType) => setValue("tipo_chave_pix", value)}
                  defaultValue={watch("tipo_chave_pix")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de chave" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="CELULAR">Celular</SelectItem>
                    <SelectItem value="ALEATORIA">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chave_pix">Chave PIX</Label>
                <Input
                  id="chave_pix"
                  {...register("chave_pix", { required: "Chave PIX é obrigatória" })}
                />
                {errors.chave_pix && (
                  <p className="text-sm text-red-500 mt-1">{errors.chave_pix.message as string}</p>
                )}
              </div>
            </div>
          )}

          {/* Dados Bancários para Transferência */}
          {paymentMethod === "TRANSFERENCIA" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados da Conta Bancária</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="banco_codigo">Código do Banco</Label>
                  <Input
                    id="banco_codigo"
                    {...register("banco_codigo", { required: "Código do banco é obrigatório" })}
                  />
                  {errors.banco_codigo && (
                    <p className="text-sm text-red-500 mt-1">{errors.banco_codigo.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="banco_nome">Nome do Banco</Label>
                  <Input
                    id="banco_nome"
                    {...register("banco_nome", { required: "Nome do banco é obrigatório" })}
                  />
                  {errors.banco_nome && (
                    <p className="text-sm text-red-500 mt-1">{errors.banco_nome.message as string}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    {...register("agencia", { required: "Agência é obrigatória" })}
                  />
                  {errors.agencia && (
                    <p className="text-sm text-red-500 mt-1">{errors.agencia.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="agencia_digito">Dígito da Agência</Label>
                  <Input
                    id="agencia_digito"
                    {...register("agencia_digito")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="conta">Número da Conta</Label>
                  <Input
                    id="conta"
                    {...register("conta", { required: "Número da conta é obrigatório" })}
                  />
                  {errors.conta && (
                    <p className="text-sm text-red-500 mt-1">{errors.conta.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="conta_digito">Dígito da Conta</Label>
                  <Input
                    id="conta_digito"
                    {...register("conta_digito", { required: "Dígito da conta é obrigatório" })}
                  />
                  {errors.conta_digito && (
                    <p className="text-sm text-red-500 mt-1">{errors.conta_digito.message as string}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="tipo_conta">Tipo de Conta</Label>
                <Select
                  onValueChange={(value: AccountType) => setValue("tipo_conta", value)}
                  defaultValue={watch("tipo_conta")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORRENTE">Conta Corrente</SelectItem>
                    <SelectItem value="POUPANCA">Conta Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Dados Bancários"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
