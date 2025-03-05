import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Eye, Trash2, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { User } from "./types/user";

interface UserTableRowProps {
  user: User;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onDelete: (userId: string) => void;
  onStatusChange: (userId: string, active: boolean) => void;
  onManagePlan: (user: User) => void;
}

export function UserTableRow({
  user,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  onManagePlan,
}: UserTableRowProps) {
  return (
    <TableRow>
      <TableCell>{user.full_name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.cpf}</TableCell>
      <TableCell>{user.phone}</TableCell>
      <TableCell>
        {user.user_types?.map((type) => (
          <Badge key={type.type} variant="outline" className="mr-1">
            {type.type}
          </Badge>
        ))}
      </TableCell>
      <TableCell>
        <Badge
          variant={user.active ? "default" : "destructive"}
          className="cursor-pointer"
          onClick={() => onStatusChange(user.id, !user.active)}
        >
          {user.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(user)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(user)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onManagePlan(user)}
        >
          <CreditCard className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(user.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}