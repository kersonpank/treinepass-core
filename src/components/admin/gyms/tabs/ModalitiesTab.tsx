
import { Badge } from "@/components/ui/badge";
import type { Gym } from "@/types/gym";

interface ModalitiesTabProps {
  gym: Gym;
}

export function ModalitiesTab({ gym }: ModalitiesTabProps) {
  return (
    <>
      {gym.academia_modalidades?.length ? (
        <div className="flex flex-wrap gap-2">
          {gym.academia_modalidades.map((am, index) => (
            <Badge key={index} variant="secondary">
              {am.modalidade.nome}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhuma modalidade cadastrada</p>
      )}
    </>
  );
}
