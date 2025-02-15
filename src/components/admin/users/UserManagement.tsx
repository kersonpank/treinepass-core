
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UserManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // First get user profiles with all details
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select(`
          *,
          user_types (
            type
          ),
          user_plan_subscriptions (
            status,
            start_date,
            end_date,
            benefit_plans (
              name
            )
          )
        `);

      if (profilesError) throw profilesError;

      return profiles as User[];
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["userMetrics"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: inactiveUsers }
      ] = await Promise.all([
        supabase.from("user_profiles").select("*", { count: "exact" }),
        supabase.from("user_profiles").select("*", { count: "exact" }).eq("active", true),
        supabase.from("user_profiles").select("*", { count: "exact" }).eq("active", false)
      ]);

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
      };
    }
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
        {/* Métricas */}
        <div className="grid gap-4 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.inactive || 0}</div>
            </CardContent>
          </Card>
        </div>

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
