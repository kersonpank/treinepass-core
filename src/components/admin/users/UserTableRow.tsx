
import { User } from "./types/user";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  CreditCard 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
  const activePlan = user.user_plan_subscriptions?.find(
    sub => sub.status === "active"
  );

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{user.full_name}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </TableCell>
      <TableCell>{user.cpf}</TableCell>
      <TableCell>
        {user.birth_date ? format(new Date(user.birth_date), "dd/MM/yyyy") : "-"}
      </TableCell>
      <TableCell>
        {user.user_types.map((type) => (
          <Badge key={type.type} variant="outline" className="mr-1">
            {type.type}
          </Badge>
        ))}
      </TableCell>
      <TableCell>
        {activePlan ? (
          <div className="flex flex-col">
            <Badge variant="secondary">{activePlan.benefit_plans.name}</Badge>
            <span className="text-xs text-muted-foreground mt-1">
              {format(new Date(activePlan.start_date), "dd/MM/yyyy")} - 
              {activePlan.end_date ? format(new Date(activePlan.end_date), "dd/MM/yyyy") : "∞"}
            </span>
          </div>
        ) : (
          <Badge variant="outline">Sem plano</Badge>
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={user.active}
          onCheckedChange={(checked) => onStatusChange(user.id, checked)}
        />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(user)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManagePlan(user)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Gerenciar Plano
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(user.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
