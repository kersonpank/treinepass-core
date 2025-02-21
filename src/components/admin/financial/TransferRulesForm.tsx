
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TransferRulesFormProps {
  academiaId: string;
  initialData?: any;
  onSuccess?: () => void;
}

type TransferRulesData = {
  automatic_transfer: boolean;
  minimum_transfer_amount: number;
  transfer_days: number[];
};

export function TransferRulesForm({ academiaId, initialData, onSuccess }: TransferRulesFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [transferDays, setTransferDays] = useState<number[]>(
    initialData?.transfer_days || [5]
  );

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
      transfer_days: [5]
    }
  });

  const automatic_transfer = watch('automatic_transfer');

  const addTransferDay = () => {
    const lastDay = transferDays[transferDays.length - 1] || 0;
    const nextDay = Math.min(lastDay + 5, 28);
    setTransferDays([...transferDays, nextDay]);
  };

  const removeTransferDay = (index: number) => {
    if (transferDays.length > 1) {
      const newDays = transferDays.filter((_, i) => i !== index);
      setTransferDays(newDays);
    }
  };

  const getNextTransferDate = (days: number[]) => {
    const today = new Date();
    const currentDay = today.getDate();
    const nextDays = days
      .map(day => {
        const nextDate = new Date(today.getFullYear(), today.getMonth(), day);
        if (day <= currentDay) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        return nextDate;
      })
      .sort((a, b) => a.getTime() - b.getTime());

    return nextDays[0];
  };

  const onSubmit = async (data: TransferRulesData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('transfer_rules')
        .upsert({
          academia_id: academiaId,
          automatic_transfer: data.automatic_transfer,
          minimum_transfer_amount: data.minimum_transfer_amount,
          transfer_days: transferDays
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

  const nextTransferDate = getNextTransferDate(transferDays);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Transferência</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dias de Transferência</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addTransferDay}
                disabled={transferDays.length >= 4}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Dia
              </Button>
            </div>
            
            <div className="space-y-2">
              {transferDays.map((day, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    value={day}
                    onChange={(e) => {
                      const newValue = Math.max(1, Math.min(28, parseInt(e.target.value) || 1));
                      const newDays = [...transferDays];
                      newDays[index] = newValue;
                      setTransferDays(newDays);
                    }}
                  />
                  {transferDays.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTransferDay(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">Próximo repasse previsto para:</p>
            <p className="text-lg font-bold">
              {nextTransferDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
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
