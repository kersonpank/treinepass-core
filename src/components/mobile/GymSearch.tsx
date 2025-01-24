import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Clock, Navigation } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface Modalidade {
  nome: string;
}

interface AcademiaModalidade {
  modalidade: Modalidade;
}

interface Academia {
  id: string;
  nome: string;
  endereco: string;
  horario_funcionamento: Json;
  fotos?: string[];
  latitude?: number;
  longitude?: number;
  academia_modalidades?: AcademiaModalidade[];
}

interface AcademiaWithDistance extends Academia {
  distance?: number;
}

export function GymSearch() {
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: academias, isLoading } = useQuery({
    queryKey: ["academias", search, userLocation],
    queryFn: async () => {
      let query = supabase
        .from("academias")
        .select(`
          *,
          academia_modalidades (
            modalidade:modalidades (
              nome
            )
          )
        `)
        .eq('status', 'ativo'); // Filtrar apenas academias ativas

      if (search) {
        query = query.ilike("nome", `%${search}%`);
      }

      if (userLocation) {
        query = query.not("latitude", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const academias = data as unknown as Academia[];

      if (userLocation && academias) {
        return academias
          .map(academia => ({
            ...academia,
            distance: academia.latitude && academia.longitude
              ? calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  academia.latitude,
                  academia.longitude
                )
              : Infinity,
          }))
          .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      return academias;
    },
  });

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const getHorarioFormatado = (horario: Json) => {
    try {
      const horarioObj = typeof horario === 'string' ? JSON.parse(horario) : horario;
      if (!horarioObj) return "Horário não disponível";
      
      const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
      const diasSemana = {
        'domingo': 'domingo',
        'segunda-feira': 'segunda',
        'terça-feira': 'terca',
        'quarta-feira': 'quarta',
        'quinta-feira': 'quinta',
        'sexta-feira': 'sexta',
        'sábado': 'sabado'
      };
      
      const diaHoje = diasSemana[hoje as keyof typeof diasSemana];
      if (!horarioObj[diaHoje]) return "Fechado hoje";
      
      return `${horarioObj[diaHoje].abertura} - ${horarioObj[diaHoje].fechamento}`;
    } catch {
      return "Horário não disponível";
    }
  };

  const getImageUrl = (fotos: string[] | undefined) => {
    if (!fotos || fotos.length === 0) {
      return "/lovable-uploads/ecfecf49-b6a8-4983-8a2a-bf8f276576e8.png";
    }
    
    // Garantir que a URL da imagem seja completa
    const firstImage = fotos[0];
    if (firstImage.startsWith('http')) {
      return firstImage;
    }
    
    // Se a imagem estiver no storage do Supabase
    return `${supabase.supabaseUrl}/storage/v1/object/public/academy-images/${firstImage}`;
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-16 bg-white z-40 py-4 shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar academias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={getUserLocation}
            className="shrink-0"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-4">
          {academias?.map((academia) => (
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
                <div className="space-y-3">
                  <div className="relative h-48 mb-4 rounded-md overflow-hidden">
                    <img
                      src={getImageUrl(academia.fotos)}
                      alt={academia.nome}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{getHorarioFormatado(academia.horario_funcionamento)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {academia.academia_modalidades?.map((am, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {am.modalidade.nome}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}