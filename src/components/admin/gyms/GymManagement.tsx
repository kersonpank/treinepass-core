
const { data: gyms, isLoading, refetch } = useQuery({
  queryKey: ["adminGyms"],
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
        ),
        categoria:academia_categorias (
          nome,
          valor_repasse_checkin
        ),
        academia_documentos (
          id,
          nome,
          tipo,
          caminho,
          status,
          observacoes
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Mapear os documentos para o formato esperado
    const gymsWithDocs = data.map(gym => ({
      ...gym,
      documentos: gym.academia_documentos || []
    }));

    return gymsWithDocs as unknown as Gym[];
  },
});
