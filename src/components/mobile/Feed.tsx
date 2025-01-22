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
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return academias;
    },
  });

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

  const getHorarioFormatado = (horario: any) => {
    try {
      const horarioObj = typeof horario === 'string' ? JSON.parse(horario) : horario;
      if (!horarioObj?.segunda) return "Horário não disponível";
      return `${horarioObj.segunda.abertura} - ${horarioObj.segunda.fechamento}`;
    } catch {
      return "Horário não disponível";
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="p-4 space-y-4">
        {feed?.map((academia) => (
          <Card key={academia.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{academia.nome}</CardTitle>
                  <CardDescription className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {academia.endereco}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">
                  Check-in
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {academia.fotos && academia.fotos.length > 0 ? (
                <div className="relative h-48 mb-4">
                  <img
                    src={academia.fotos[0]}
                    alt={academia.nome}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ) : (
                <div className="h-48 mb-4 bg-muted rounded-md flex items-center justify-center">
                  <DumbbellIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{getHorarioFormatado(academia.horario_funcionamento)}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {academia.modalidades?.map((modalidade, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {modalidade}
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