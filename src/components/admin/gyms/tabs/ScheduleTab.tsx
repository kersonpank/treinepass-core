
import type { Gym } from "@/types/gym";

interface ScheduleTabProps {
  gym: Gym;
}

export function ScheduleTab({ gym }: ScheduleTabProps) {
  return (
    <>
      {gym.horario_funcionamento ? (
        <div className="space-y-2">
          {Object.entries(gym.horario_funcionamento).map(([dia, horario]: [string, any]) => (
            <div key={dia} className="flex justify-between">
              <span className="font-semibold capitalize">{dia}</span>
              <span>{horario.abertura} - {horario.fechamento}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum horário cadastrado</p>
      )}
    </>
  );
}
