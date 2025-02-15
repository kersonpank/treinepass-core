
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "../types/user";

export function useUserActions() {
  const { toast } = useToast();

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

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      return false;
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja desativar este usuário?")) return false;

    try {
      // Instead of deleting, we just set active to false
      const { error } = await supabase
        .from("user_profiles")
        .update({ active: false })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário desativado com sucesso",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      return false;
    }
  };

  const handleEdit = async (userId: string, data: Partial<User>) => {
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

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      return false;
    }
  };

  return {
    handleStatusChange,
    handleDelete,
    handleEdit,
  };
}
