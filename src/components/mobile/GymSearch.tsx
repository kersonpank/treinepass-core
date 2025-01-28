import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Clock, Navigation } from "lucide-react";
import { GymCard } from "./GymCard";
import useEmblaCarousel from 'embla-carousel-react';

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
  horario_funcionamento: Record<string, any>;
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
  const [emblaRef] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps'
  });

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
        .eq('status', 'ativo');

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
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distância em km
    return d;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const getImageUrl = (fotos: string[] | undefined) => {
    if (!fotos || fotos.length === 0) return undefined;
    
    const firstImage = fotos[0];
    if (firstImage.startsWith('http')) {
      return firstImage;
    }
    
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${firstImage}`;
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

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      ) : academias?.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Nenhuma academia encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {academias?.map((academia) => (
              <div key={academia.id} className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] min-w-0">
                <GymCard
                  id={academia.id}
                  name={academia.nome}
                  address={academia.endereco}
                  imageUrl={getImageUrl(academia.fotos)}
                  horario_funcionamento={academia.horario_funcionamento}
                  modalidades={academia.academia_modalidades}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
