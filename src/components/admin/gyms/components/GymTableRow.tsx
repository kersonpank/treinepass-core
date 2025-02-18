
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Eye, Image } from "lucide-react";
import type { Gym } from "@/types/gym";

interface GymTableRowProps {
  gym: Gym;
  onView: (gym: Gym) => void;
  onEdit: (gym: Gym) => void;
  onPhotos: (gym: Gym) => void;
}

export function GymTableRow({ gym, onView, onEdit, onPhotos }: GymTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{gym.nome}</TableCell>
      <TableCell>{gym.cnpj}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{gym.email}</span>
          <span className="text-muted-foreground">{gym.telefone}</span>
        </div>
      </TableCell>
      <TableCell>
        {gym.categoria?.nome || "Sem categoria"}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {gym.modalidades?.map((modalidade, index) => (
            <Badge key={index} variant="secondary">
              {modalidade}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge 
          variant={gym.status === "ativo" ? "default" : "secondary"}
        >
          {gym.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(gym)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(gym)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPhotos(gym)}
          >
            <Image className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
