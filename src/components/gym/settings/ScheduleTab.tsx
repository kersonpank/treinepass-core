
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScheduleTabProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export function ScheduleTab({ watch, setValue }: ScheduleTabProps) {
  const diasSemana = [
    { key: 'domingo', label: 'Domingo' },
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
  ];

  const handleHorarioChange = (dia: string, tipo: 'abertura' | 'fechamento', value: string) => {
    setValue(`horario_funcionamento.${dia}.${tipo}`, value);
  };

  const horario_funcionamento = watch("horario_funcionamento");

  return (
    <div className="space-y-4">
      {diasSemana.map(({ key, label }) => (
        <div key={key} className="grid grid-cols-3 gap-4 items-center">
          <Label>{label}</Label>
          <div>
            <Label htmlFor={`${key}-abertura`}>Abertura</Label>
            <Input
              id={`${key}-abertura`}
              type="time"
              value={horario_funcionamento[key]?.abertura || ""}
              onChange={(e) => handleHorarioChange(key, 'abertura', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`${key}-fechamento`}>Fechamento</Label>
            <Input
              id={`${key}-fechamento`}
              type="time"
              value={horario_funcionamento[key]?.fechamento || ""}
              onChange={(e) => handleHorarioChange(key, 'fechamento', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
