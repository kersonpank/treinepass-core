
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "./types/user";
import { UserTable } from "./UserTable";
import { UserEditDialog } from "./UserEditDialog";
import { UserViewDialog } from "./UserViewDialog";
import { ManageUserPlanDialog } from "./ManageUserPlanDialog";
import { UserMetrics } from "./components/UserMetrics";
import { useUsers } from "./hooks/useUsers";
import { useUserActions } from "./hooks/useUserActions";

export function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const { data: users = [], isLoading, refetch } = useUsers();
  const { handleStatusChange, handleDelete, handleEdit } = useUserActions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <UserMetrics />
        
        <UserTable
          users={users}
          onEdit={(user) => {
            setSelectedUser(user);
            setIsEditDialogOpen(true);
          }}
          onView={(user) => {
            setSelectedUser(user);
            setIsViewDialogOpen(true);
          }}
          onDelete={async (userId) => {
            const success = await handleDelete(userId);
            if (success) refetch();
          }}
          onStatusChange={async (userId, active) => {
            const success = await handleStatusChange(userId, active);
            if (success) refetch();
          }}
          onManagePlan={(user) => {
            setSelectedUser(user);
            setIsPlanDialogOpen(true);
          }}
        />

        <UserEditDialog
          user={selectedUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={async (userId, data) => {
            const success = await handleEdit(userId, data);
            if (success) {
              refetch();
              setIsEditDialogOpen(false);
            }
          }}
        />

        <UserViewDialog
          user={selectedUser}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />

        <ManageUserPlanDialog
          user={selectedUser}
          open={isPlanDialogOpen}
          onOpenChange={setIsPlanDialogOpen}
          onSuccess={() => {
            refetch();
            setIsPlanDialogOpen(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
