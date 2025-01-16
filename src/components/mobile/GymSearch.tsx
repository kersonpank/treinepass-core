import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin } from "lucide-react";

interface Academia {
  id: string;
  nome: string;
  endereco: string;
  modalidades: string[];
  latitude: number | null;
  longitude: number | null;
  distance?: number;
}

export function GymSearch() {
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: academias, isLoading } = useQuery({
    queryKey: ["academias", search, userLocation],
    queryFn: async () => {
      let query = supabase.from("academias").select("*");

      if (search) {
        query = query.ilike("nome", `%${search}%`);
      }

      if (userLocation) {
        query = query.not("latitude", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (userLocation && data) {
        return (data as Academia[])
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

      return data as Academia[];
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
    return R * c; // Distância em km
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar academias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" size="icon" onClick={getUserLocation}>
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          {academias?.map((academia) => (
            <Card key={academia.id}>
              <CardHeader>
                <CardTitle className="text-lg">{academia.nome}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{academia.endereco}</p>
                {academia.distance !== undefined && (
                  <p className="text-sm text-primary mt-1">
                    {academia.distance.toFixed(1)} km de distância
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {academia.modalidades.map((modalidade, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {modalidade}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}