import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";

interface HorarioFuncionamento {
  [key: string]: {
    abertura: string;
    fechamento: string;
  };
}

interface Modalidade {
  id: string;
  nome: string;
}

interface Academia {
  id: string;
  nome: string;
  endereco: string;
  horario_funcionamento: HorarioFuncionamento | null;
  fotos: string[];
  modalidades: Modalidade[];
}

export function Feed() {
  const { data: feed, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      // Primeiro, buscar as academias
      const { data: academias, error: academiasError } = await supabase
        .from("academias")
        .select(`
          id,
          nome,
          endereco,
          horario_funcionamento,
          fotos,
          modalidades
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (academiasError) throw academiasError;

      // Depois, buscar as modalidades
      const { data: modalidades, error: modalidadesError } = await supabase
        .from("modalidades")
        .select("id, nome");

      if (modalidadesError) throw modalidadesError;

      // Criar um mapa de modalidades para fácil acesso
      const modalidadesMap = new Map(modalidades.map(m => [m.id, m.nome]));

      // Transformar os dados para incluir os nomes das modalidades
      return academias.map((academia: any) => ({
        ...academia,
        horario_funcionamento: academia.horario_funcionamento 
          ? JSON.parse(JSON.stringify(academia.horario_funcionamento)) 
          : null,
        fotos: Array.isArray(academia.fotos) ? academia.fotos : [],
        modalidades: (academia.modalidades || []).map((id: string) => ({
          id,
          nome: modalidadesMap.get(id) || 'Modalidade não encontrada'
        }))
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {feed?.map((academia) => (
        <Card key={academia.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <div className="aspect-video w-full overflow-hidden">
                {academia.fotos && academia.fotos.length > 0 ? (
                  <img
                    src={academia.fotos[0]}
                    alt={academia.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <img
                      src="/lovable-uploads/ecfecf49-b6a8-4983-8a2a-bf8f276576e8.png"
                      alt="Placeholder"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">{academia.nome}</h3>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  {academia.endereco}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {academia.modalidades?.map((modalidade) => (
                    <span
                      key={modalidade.id}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {modalidade.nome}
                    </span>
                  ))}
                </div>

                {academia.horario_funcionamento && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>
                      {academia.horario_funcionamento.segunda?.abertura} - {academia.horario_funcionamento.segunda?.fechamento}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}