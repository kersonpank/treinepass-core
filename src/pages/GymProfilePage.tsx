import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gym } from "@/types/gym";

export function GymProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: gym, isLoading } = useQuery({
    queryKey: ["gym", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select(`
          *,
          academia_modalidades (
            modalidade:modalidades (
              id,
              nome
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Gym;
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!gym) {
    return <div>Academia não encontrada</div>;
  }

  return (
    <div>
      <h1>{gym.nome}</h1>
      {/* Adicione mais detalhes conforme necessário */}
    </div>
  );
}