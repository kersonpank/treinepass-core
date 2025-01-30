import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Gym } from "@/types/gym";

interface Modalidade {
  nome: string;
}

interface AcademiaModalidade {
  modalidade: Modalidade;
}

export function GymProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: gym, isLoading } = useQuery<Gym>({
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
    return <div className="p-4"><Skeleton className="w-full h-[200px] rounded-lg" /></div>;
  }

  if (!gym) {
    return <div className="p-4">Academia não encontrada</div>;
  }

  const formatHorario = (horario: Record<string, any>) => {
    const diasSemana = {
      domingo: "Domingo",
      segunda: "Segunda-feira",
      terca: "Terça-feira",
      quarta: "Quarta-feira",
      quinta: "Quinta-feira",
      sexta: "Sexta-feira",
      sabado: "Sábado"
    };

    return Object.entries(horario).map(([dia, horarios]) => {
      const { abertura, fechamento } = horarios as { abertura: string; fechamento: string };
      return `${diasSemana[dia as keyof typeof diasSemana]}: ${abertura} - ${fechamento}`;
    });
  };

  const getImageUrl = (foto: string) => {
    if (foto.startsWith('http')) {
      return foto;
    }
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${foto}`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      {gym.fotos && gym.fotos.length > 0 && (
        <Carousel className="w-full max-w-3xl mx-auto">
          <CarouselContent>
            {gym.fotos.map((foto, index) => (
              <CarouselItem key={index}>
                <div className="aspect-video">
                  <img
                    src={getImageUrl(foto)}
                    alt={`${gym.nome} - Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">{gym.nome}</h1>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Endereço</h2>
            <p className="text-muted-foreground">{gym.endereco}</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Contato</h2>
            <p className="text-muted-foreground">Telefone: {gym.telefone}</p>
            <p className="text-muted-foreground">Email: {gym.email}</p>
          </div>

          {gym.academia_modalidades && gym.academia_modalidades.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Modalidades</h2>
              <div className="flex flex-wrap gap-2">
                {gym.academia_modalidades.map((am, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {am.modalidade.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

          {gym.horario_funcionamento && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Horário de Funcionamento</h2>
              <div className="space-y-1">
                {formatHorario(gym.horario_funcionamento as Record<string, any>).map((horario) => (
                  <p key={horario} className="text-muted-foreground">{horario}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={() => navigate(`/app/digital-card/${gym.id}`)}>
        Fazer Check-in
      </Button>
    </div>
  );
}