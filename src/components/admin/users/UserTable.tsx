import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User } from "./types/user";
import { UserTableRow } from "./UserTableRow";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onDelete: (userId: string) => void;
  onStatusChange: (userId: string, active: boolean) => void;
  onManagePlan: (user: User) => void;
}

export function UserTable({
  users,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  onManagePlan,
}: UserTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onManagePlan={onManagePlan}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}