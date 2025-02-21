
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BankDetailsFormProps {
  academiaId: string;
  initialData?: any;
  onSuccess?: () => void;
}

type BankFormData = {
  titular_nome: string;
  titular_cpf_cnpj: string;
  titular_tipo: 'PF' | 'PJ';
  banco_codigo: string;
  banco_nome: string;
  agencia: string;
  agencia_digito?: string;
  conta: string;
  conta_digito?: string;
  tipo_conta: 'corrente' | 'poupanca';
  chave_pix?: string;
  tipo_chave_pix?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  metodo_preferencial: 'PIX' | 'TRANSFERENCIA';
};

export function BankDetailsForm({ academiaId, initialData, onSuccess }: BankDetailsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BankFormData>({
    defaultValues: initialData || {
      titular_tipo: 'PF',
      tipo_conta: 'corrente',
      metodo_preferencial: 'PIX'
    }
  });

  const titular_tipo = watch('titular_tipo');
  const metodo_preferencial = watch('metodo_preferencial');

  const onSubmit = async (data: BankFormData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('academia_dados_bancarios')
        .upsert({
          academia_id: academiaId,
          ...data
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados bancários atualizados com sucesso",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Bancários</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Tipo de Titular</Label>
              <Select 
                defaultValue={titular_tipo} 
                onValueChange={(value) => setValue('titular_tipo', value as 'PF' | 'PJ')}
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
              <Label>Nome do Titular</Label>
              <Input {...register("titular_nome", { required: "Nome é obrigatório" })} />
              {errors.titular_nome && (
                <p className="text-sm text-red-500">{errors.titular_nome.message}</p>
              )}
            </div>

            <div>
              <Label>{titular_tipo === 'PF' ? 'CPF' : 'CNPJ'} do Titular</Label>
              <Input {...register("titular_cpf_cnpj", { required: "Este campo é obrigatório" })} />
              {errors.titular_cpf_cnpj && (
                <p className="text-sm text-red-500">{errors.titular_cpf_cnpj.message}</p>
              )}
            </div>

            <div>
              <Label>Código do Banco</Label>
              <Input {...register("banco_codigo", { required: "Código do banco é obrigatório" })} />
              {errors.banco_codigo && (
                <p className="text-sm text-red-500">{errors.banco_codigo.message}</p>
              )}
            </div>

            <div>
              <Label>Nome do Banco</Label>
              <Input {...register("banco_nome", { required: "Nome do banco é obrigatório" })} />
              {errors.banco_nome && (
                <p className="text-sm text-red-500">{errors.banco_nome.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Agência</Label>
                <Input {...register("agencia", { required: "Agência é obrigatória" })} />
                {errors.agencia && (
                  <p className="text-sm text-red-500">{errors.agencia.message}</p>
                )}
              </div>
              <div>
                <Label>Dígito da Agência</Label>
                <Input {...register("agencia_digito")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Conta</Label>
                <Input {...register("conta", { required: "Conta é obrigatória" })} />
                {errors.conta && (
                  <p className="text-sm text-red-500">{errors.conta.message}</p>
                )}
              </div>
              <div>
                <Label>Dígito da Conta</Label>
                <Input {...register("conta_digito")} />
              </div>
            </div>

            <div>
              <Label>Tipo de Conta</Label>
              <Select 
                defaultValue="corrente"
                onValueChange={(value) => setValue('tipo_conta', value as 'corrente' | 'poupanca')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Método Preferencial de Recebimento</Label>
              <Select 
                defaultValue={metodo_preferencial}
                onValueChange={(value) => setValue('metodo_preferencial', value as 'PIX' | 'TRANSFERENCIA')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método preferencial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {metodo_preferencial === 'PIX' && (
              <>
                <div>
                  <Label>Tipo de Chave PIX</Label>
                  <Select 
                    onValueChange={(value) => setValue('tipo_chave_pix', value as 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de chave" />
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
                  <Label>Chave PIX</Label>
                  <Input {...register("chave_pix")} />
                </div>
              </>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Dados Bancários
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
