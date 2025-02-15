
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return false;

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
