
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Eye, Trash2, CheckCircle2, XCircle, Image } from "lucide-react";
import type { Gym } from "@/types/gym";

interface GymListProps {
  gyms: Gym[];
  onStatusChange: (gymId: string, newStatus: string) => void;
  onEdit: (gym: Gym) => void;
  onView: (gym: Gym) => void;
  onPhotos: (gym: Gym) => void;
  onDelete: (gymId: string) => void;
  getImageUrl: (path: string) => string;
}

export function GymList({
  gyms,
  onStatusChange,
  onEdit,
  onView,
  onPhotos,
  onDelete,
  getImageUrl,
}: GymListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gyms?.map((gym) => (
            <TableRow key={gym.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {gym.fotos?.[0] && (
                    <img
                      src={getImageUrl(gym.fotos[0])}
                      alt={gym.nome}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  {gym.nome}
                </div>
              </TableCell>
              <TableCell>{gym.cnpj}</TableCell>
              <TableCell>{gym.email}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    gym.status === "ativo" 
                      ? "default" 
                      : gym.status === "inativo" 
                        ? "secondary" 
                        : "outline"
                  }
                >
                  {gym.status === "ativo" ? "Ativo" : gym.status === "inativo" ? "Inativo" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end space-x-2">
                  {gym.status === "pendente" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStatusChange(gym.id, "ativo")}
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  {gym.status === "ativo" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStatusChange(gym.id, "inativo")}
                      className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {gym.status === "inativo" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStatusChange(gym.id, "ativo")}
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(gym)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPhotos(gym)}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onView(gym)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(gym.id)}
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
