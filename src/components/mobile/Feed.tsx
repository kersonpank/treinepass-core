import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DumbbellIcon } from "lucide-react";

export function Feed() {
  const { data: feed, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data: academias, error } = await supabase
        .from("academias")
        .select(`
          *,
          modalidades:modalidades(nome)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return academias;
    },
  });

  const getHorarioFormatado = (horario: any) => {
    try {
      const horarioObj = typeof horario === 'string' ? JSON.parse(horario) : horario;
      if (!horarioObj) return "Horário não disponível";
      
      const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0];
      const diasSemana = {
        'domingo': 'domingo',
        'segunda': 'segunda',
        'terça': 'terca',
        'quarta': 'quarta',
        'quinta': 'quinta',
        'sexta': 'sexta',
        'sábado': 'sabado'
      };
      
      const diaHoje = diasSemana[hoje as keyof typeof diasSemana];
      if (!horarioObj[diaHoje]) return "Fechado hoje";
      
      return `Hoje: ${horarioObj[diaHoje].abertura} - ${horarioObj[diaHoje].fechamento}`;
    } catch {
      return "Horário não disponível";
    }
  };

  const getPlaceholderImage = () => {
    return "/lovable-uploads/ecfecf49-b6a8-4983-8a2a-bf8f276576e8.png";
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="p-4 space-y-4">
        {feed?.map((academia) => (
          <Card key={academia.id} className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{academia.nome}</CardTitle>
                  <CardDescription className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {academia.endereco}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0 hover:bg-primary hover:text-white transition-colors"
                >
                  Check-in
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 mb-4 rounded-md overflow-hidden">
                {academia.fotos && academia.fotos.length > 0 ? (
                  <img
                    src={academia.fotos[0]}
                    alt={academia.nome}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <img
                      src={getPlaceholderImage()}
                      alt="Placeholder"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{getHorarioFormatado(academia.horario_funcionamento)}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {academia.modalidades?.map((modalidade: any, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {modalidade.nome || modalidade}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}