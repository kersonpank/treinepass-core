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
      <TableCell className="font-medium">{user.full_name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.cpf}</TableCell>
      <TableCell>
        {user.user_types.map((type) => (
          <Badge key={type.type} className="mr-1">
            {type.type}
          </Badge>
        ))}
      </TableCell>
      <TableCell>
        <Badge variant={user.active ? "default" : "secondary"}>
          {user.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex justify-end space-x-2">
          {!user.active ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStatusChange(user.id, true)}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStatusChange(user.id, false)}
              className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
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
            onClick={() => onView(user)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(user.id)}
            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onManagePlan(user)}
            className="h-8 w-8"
          >
            <CreditCard className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}