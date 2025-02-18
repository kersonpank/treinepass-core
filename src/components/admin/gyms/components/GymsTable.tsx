
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { GymTableRow } from "./GymTableRow";
import type { Gym } from "@/types/gym";

interface GymsTableProps {
  gyms: Gym[] | undefined;
  onView: (gym: Gym) => void;
  onEdit: (gym: Gym) => void;
  onPhotos: (gym: Gym) => void;
}

export function GymsTable({ gyms, onView, onEdit, onPhotos }: GymsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Academia</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Modalidades</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gyms?.map((gym) => (
            <GymTableRow
              key={gym.id}
              gym={gym}
              onView={onView}
              onEdit={onEdit}
              onPhotos={onPhotos}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
