import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useAcademia() {
  const { user } = useAuth();

  const { data: academia, isLoading } = useQuery({
    queryKey: ["currentAcademia", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Primeiro, verificar se o usuário é admin
      const { data: userTypes, error: userTypesError } = await supabase
        .from("user_types")
        .select("type")
        .eq("user_id", user.id);

      if (userTypesError) throw userTypesError;

      const isAdmin = userTypes?.some(t => t.type === "admin");

      if (isAdmin) {
        // Se for admin, buscar a academia que ele administra
        const { data: adminAcademia, error: adminAcademiaError } = await supabase
          .from("academias")
          .select("*")
          .eq("admin_user_id", user.id)
          .single();

        if (adminAcademiaError && adminAcademiaError.code !== "PGRST116") {
          throw adminAcademiaError;
        }

        return adminAcademia;
      } else {
        // Se não for admin, buscar a academia vinculada ao usuário
        const { data: userAcademia, error: userAcademiaError } = await supabase
          .from("user_academias")
          .select("academias (*)")
          .eq("user_id", user.id)
          .single();

        if (userAcademiaError && userAcademiaError.code !== "PGRST116") {
          throw userAcademiaError;
        }

        return userAcademia?.academias || null;
      }
    },
    enabled: !!user,
  });

  return {
    academia,
    isLoading,
  };
}
