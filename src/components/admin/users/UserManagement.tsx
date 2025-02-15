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
      // First get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Then for each profile, get their types and subscriptions
      const usersWithData = await Promise.all(
        profiles.map(async (profile) => {
          // Get user types
          const { data: types } = await supabase
            .from("user_types")
            .select("type")
            .eq("user_id", profile.id);

          // Get user plan subscriptions
          const { data: subscriptions } = await supabase
            .from("user_plan_subscriptions")
            .select(`
              status,
              start_date,
              end_date,
              plan_id,
              benefit_plans (
                name
              )
            `)
            .eq("user_id", profile.id);

          return {
            ...profile,
            phone_number: profile.phone_number || null, // Garantindo que phone_number existe
            user_types: types || [],
            user_plan_subscriptions: subscriptions || []
          };
        })
      );

      return usersWithData as User[];
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
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
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
          onSubmit={async (userId, data) => {
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
