import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";

interface OperatingHoursFormProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  replicateHours: boolean;
  setReplicateHours: (value: boolean) => void;
}

export function OperatingHoursForm({
  register,
  watch,
  setValue,
  replicateHours,
  setReplicateHours,
}: OperatingHoursFormProps) {
  const diasSemana = [
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
    "domingo",
  ];

  const segundaAbertura = watch("horario_funcionamento.segunda.abertura");
  const segundaFechamento = watch("horario_funcionamento.segunda.fechamento");

  useEffect(() => {
    if (replicateHours && segundaAbertura && segundaFechamento) {
      diasSemana.forEach((dia) => {
        if (dia !== "segunda") {
          setValue(`horario_funcionamento.${dia}.abertura`, segundaAbertura);
          setValue(`horario_funcionamento.${dia}.fechamento`, segundaFechamento);
        }
      });
    }
  }, [segundaAbertura, segundaFechamento, replicateHours, setValue]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Horários de Funcionamento</h3>
        <div className="flex items-center space-x-2">
          <Switch
            checked={replicateHours}
            onCheckedChange={setReplicateHours}
            id="replicate-hours"
          />
          <Label htmlFor="replicate-hours">Replicar horários</Label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diasSemana.map((dia) => (
          <div key={dia} className="space-y-2">
            <Label>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                {...register(`horario_funcionamento.${dia}.abertura` as const, {
                  required: true,
                })}
                disabled={replicateHours && dia !== "segunda"}
              />
              <Input
                type="time"
                {...register(
                  `horario_funcionamento.${dia}.fechamento` as const,
                  { required: true }
                )}
                disabled={replicateHours && dia !== "segunda"}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}