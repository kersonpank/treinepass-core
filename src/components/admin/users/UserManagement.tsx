
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "./types/user";
import { UserTable } from "./UserTable";
import { UserEditDialog } from "./UserEditDialog";
import { UserViewDialog } from "./UserViewDialog";
import { ManageUserPlanDialog } from "./ManageUserPlanDialog";

export function UserManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const usersWithTypes = await Promise.all(
        profiles.map(async (profile) => {
          const { data: types, error: typesError } = await supabase
            .from("user_types")
            .select("type")
            .eq("user_id", profile.id);

          if (typesError) throw typesError;

          return {
            ...profile,
            user_types: types || [],
            active: true, // Default value for now
          };
        })
      );

      return usersWithTypes as User[];
    },
  });

  const handleStatusChange = async (userId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ active })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${active ? "ativado" : "desativado"} com sucesso`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      // First confirm with the user
      if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

      // Call the Supabase RPC function for cascading delete
      const { error } = await supabase.rpc("delete_user_cascade", { target_user_id: userId });

      if (error) {
        console.error("Error deleting user via cascade:", error);
        throw new Error(`Erro ao excluir usuário: ${error.message}`);
      }

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });

      refetch();
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao tentar excluir o usuário",
      });
    }
  };


  const handleEditUser = async (userId: string, data: Partial<User>) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update(data)
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      refetch();
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

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
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onManagePlan={(user) => {
            setSelectedUser(user);
            setIsPlanDialogOpen(true);
          }}
        />

        <UserEditDialog
          user={selectedUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditUser}
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
