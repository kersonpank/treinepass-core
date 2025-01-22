import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Clock, DumbbellIcon, Navigation } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Academia = Tables<"academias">;

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
            modalidade: modalidades (
              nome
            )
          )
        `);

      if (search) {
        query = query.ilike("nome", `%${search}%`);
      }

      if (userLocation) {
        query = query.not("latitude", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (userLocation && data) {
        return (data as AcademiaWithDistance[])
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

      return data as AcademiaWithDistance[];
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
                  {academia.distance !== undefined && (
                    <div className="flex items-center text-sm font-medium text-primary">
                      <Navigation className="h-4 w-4 mr-2" />
                      {academia.distance.toFixed(1)} km de distância
                    </div>
                  )}

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{getHorarioFormatado(academia.horario_funcionamento)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {academia.academia_modalidades?.map((am: any, index: number) => (
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