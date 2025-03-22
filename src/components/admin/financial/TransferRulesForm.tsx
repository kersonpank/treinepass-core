
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TransferRulesFormProps {
  academiaId: string;
  initialData?: any;
  onSuccess?: () => void;
}

type TransferRulesData = {
  automatic_transfer: boolean;
  minimum_transfer_amount: number;
  transfer_day: number;
};

export function TransferRulesForm({ academiaId, initialData, onSuccess }: TransferRulesFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TransferRulesData>({
    defaultValues: initialData || {
      automatic_transfer: true,
      minimum_transfer_amount: 20,
      transfer_day: 5
    }
  });

  const automatic_transfer = watch('automatic_transfer');

  const onSubmit = async (data: TransferRulesData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('transfer_rules')
        .upsert({
          academia_id: academiaId,
          ...data
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Regras de transferência atualizadas com sucesso",
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
        <CardTitle>Regras de Transferência</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transferência Automática</Label>
              <p className="text-sm text-muted-foreground">
                Ative para realizar transferências automaticamente
              </p>
            </div>
            <Switch
              checked={automatic_transfer}
              onCheckedChange={(checked) => setValue('automatic_transfer', checked)}
            />
          </div>

          <div>
            <Label>Valor Mínimo para Transferência (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("minimum_transfer_amount", {
                required: "Valor mínimo é obrigatório",
                min: { value: 0, message: "Valor deve ser maior que zero" }
              })}
            />
            {errors.minimum_transfer_amount && (
              <p className="text-sm text-red-500">{errors.minimum_transfer_amount.message}</p>
            )}
          </div>

          <div>
            <Label>Dia do Mês para Transferência</Label>
            <Input
              type="number"
              min="1"
              max="28"
              {...register("transfer_day", {
                required: "Dia é obrigatório",
                min: { value: 1, message: "Dia deve ser entre 1 e 28" },
                max: { value: 28, message: "Dia deve ser entre 1 e 28" }
              })}
            />
            {errors.transfer_day && (
              <p className="text-sm text-red-500">{errors.transfer_day.message}</p>
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
                Salvar Regras
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
